import os
import sys
import logging
import json
import asyncio
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any, List

# Add parent directory to path to maintain your import structure
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import google.generativeai as genai

# Relative imports from your project structure
try:
    from agents.langgraph_agent import SQLLangGraphAgentGemini
    from db.vector_db_store import get_vector_store
    from db.query_runnerV2 import RedshiftSQLTool
    from db.table_descriptions_semantic import join_details, schema_info
except ImportError as e:
    print(f"Critical Import Error: {e}")
    print("Ensure you are running this from the correct directory so relative imports work.")
    sys.exit(1)

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Load Environment
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    logger.error("GOOGLE_API_KEY not found in environment variables")
else:
    genai.configure(api_key=GOOGLE_API_KEY)

# --- Pydantic Models ---

class ChatRequest(BaseModel):
    question: str = Field(..., description="The user's natural language query")
    thread_id: str = Field(default="default", description="Session ID for conversation history")

class ChartConfig(BaseModel):
    type: str
    title: str
    x_axis: Optional[str] = None
    y_axis: Optional[str] = None
    reason: Optional[str] = None

class ChartAnalysis(BaseModel):
    chartable: bool
    reasoning: Optional[str] = None
    auto_chart: Optional[ChartConfig] = None
    suggested_charts: Optional[List[Dict[str, Any]]] = None

class ChatResponse(BaseModel):
    sql_query: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    chart_analysis: Optional[ChartAnalysis] = None
    error: Optional[str] = None
    record_count: int = 0

# --- Chatbot Service Logic ---

class ChatbotService:
    def __init__(self):
        self.vector_store = None
        self.query_runner = None
        self.gemini_agent = None
        self._init_agent_components()
    
    def _init_agent_components(self):
        """Initialize agent components once during startup"""
        logger.info("Initializing Gemini SQL Agent components...")
        
        # Load existing vector store
        try:
            self.vector_store = get_vector_store()
            if self.vector_store:
                logger.info("✓ Existing vector store loaded successfully.")
            else:
                logger.warning("⚠ Warning: No existing vector store found.")
        except Exception as e:
            logger.error(f"✗ Error loading vector store: {e}")
            self.vector_store = None
        
        # Initialize Query Runner
        try:
            self.query_runner = RedshiftSQLTool()
            logger.info("✓ Redshift query runner initialized.")
        except Exception as e:
            logger.error(f"⚠ Could not initialize Redshift query runner: {e}")
            self.query_runner = None
        
        # Initialize the Gemini Agent
        if self.vector_store:
            try:
                self.gemini_agent = SQLLangGraphAgentGemini(
                    vector_store=self.vector_store,
                    join_details=join_details,
                    schema_info=schema_info,
                    query_runner=self.query_runner
                )
                logger.info("✓ Gemini SQL LangGraph Agent initialized successfully.")
            except Exception as e:
                logger.error(f"✗ Error initializing Gemini agent: {e}")
                self.gemini_agent = None
        else:
            logger.error("✗ Cannot initialize agent without vector store.")
            self.gemini_agent = None

    async def get_response(self, user_question: str, thread_id: str = "default") -> Dict[str, Any]:
        """Processes the user's question"""
        
        if not self.gemini_agent:
            return {"error": "SQL Agent not initialized. Server error or missing vector store."}
        
        if not self.vector_store:
            return {"error": "No existing vector store found."}

        logger.info(f"Processing query for thread: {thread_id} | Q: {user_question}")

        try:
            # Process the user question
            result = self.gemini_agent.process_query(user_question, thread_id=thread_id)
            return result
        except Exception as e:
            logger.exception("Error occurred during query processing")
            return {"error": str(e)}

# --- FastAPI App Setup ---

# Global instance placeholder
chatbot_service: Optional[ChatbotService] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the Chatbot Service
    global chatbot_service
    chatbot_service = ChatbotService()
    yield
    # Shutdown: Clean up if necessary (e.g., close DB connections)
    logger.info("Shutting down SQL Chatbot API")

app = FastAPI(
    title="SQL RAG Chatbot API",
    description="API for converting natural language to Redshift SQL queries with visualization suggestions.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration (Adjust origins for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Endpoints ---

@app.get("/health")
async def health_check():
    """Check the health of the agent components"""
    if not chatbot_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    status_report = {
        "vector_store": chatbot_service.vector_store is not None,
        "query_runner": chatbot_service.query_runner is not None,
        "agent_ready": chatbot_service.gemini_agent is not None
    }
    
    if not status_report["agent_ready"]:
        return JSONResponse(status_code=503, content=status_report)
        
    return status_report

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint.
    Receives a natural language question and returns SQL data + chart config.
    """
    if not chatbot_service or not chatbot_service.gemini_agent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Chatbot agent is not fully initialized. Check server logs."
        )

    # Get raw response from agent
    raw_result = await chatbot_service.get_response(request.question, request.thread_id)
    
    # Handle Errors from the agent
    if raw_result.get("error") or not raw_result.get("success", True):
        return ChatResponse(
            error=raw_result.get("error", "Unknown error occurred processing query")
        )

    # Parse JSON data string to Python Object
    data_content = []
    execution_data_str = raw_result.get("execution_data_json", "[]")
    try:
        data_content = json.loads(execution_data_str)
    except json.JSONDecodeError:
        logger.warning("Failed to parse execution_data_json")
        data_content = []

    # Map raw result to Pydantic Response
    response = ChatResponse(
        sql_query=raw_result.get("cleaned_sql_query"),
        data=data_content,
        record_count=len(data_content) if isinstance(data_content, list) else 0,
        chart_analysis=raw_result.get("chart_analysis")
    )
    
    return response

if __name__ == "__main__":
    import uvicorn
    # Run with: python api.py
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
