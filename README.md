# SQL RAG Chatbot - Natural Language to SQL and Visualization

A full-stack application that converts natural language questions into SQL queries, executes them against a Redshift database, and provides intelligent chart recommendations for data visualization.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Installation](#installation)
7. [Configuration](#configuration)
8. [Running the Application](#running-the-application)
9. [API Documentation](#api-documentation)
10. [Frontend Components](#frontend-components)
11. [Workflow Pipeline](#workflow-pipeline)
12. [Database Schema Management](#database-schema-management)
13. [Troubleshooting](#troubleshooting)

---

## Overview

This chatbot allows users to ask questions about their data in plain English. The system:

1. Interprets the natural language query
2. Searches for relevant database schema using semantic embeddings
3. Generates an appropriate SQL query using Google Gemini LLM
4. Validates and executes the query against Amazon Redshift
5. Analyzes the results and suggests appropriate chart visualizations
6. Returns structured JSON data to the frontend for rendering

---

## Architecture

```
+------------------+     HTTP/REST      +------------------+
|                  | <----------------> |                  |
|  React Frontend  |                    |  FastAPI Backend |
|  (Vite + TS)     |                    |  (Python)        |
|                  |                    |                  |
+------------------+                    +--------+---------+
                                                 |
                    +----------------------------+----------------------------+
                    |                            |                            |
            +-------v-------+           +--------v--------+          +--------v--------+
            |               |           |                 |          |                 |
            | PostgreSQL    |           | Google Gemini   |          | Amazon Redshift |
            | (PGVector)    |           | LLM API         |          | (Data Source)   |
            | Schema Store  |           |                 |          |                 |
            +---------------+           +-----------------+          +-----------------+
```

### Data Flow

1. User submits a question via the React frontend
2. Frontend sends POST request to `/chat` endpoint
3. Backend processes the query through LangGraph workflow:
   - Rewrites question for context (if follow-up)
   - Searches vector database for relevant schema
   - Generates SQL using Gemini LLM
   - Validates query for safety
   - Executes against Redshift
   - Analyzes results for chart compatibility
4. Backend returns structured JSON response
5. Frontend renders SQL, data table, and charts

---

## Technology Stack

### Backend

| Component | Technology |
|-----------|------------|
| Framework | FastAPI |
| LLM | Google Gemini 2.5 Flash |
| Orchestration | LangGraph (State Machine) |
| Vector Store | PostgreSQL with pgvector |
| Embeddings | Google Generative AI Embeddings |
| Database | Amazon Redshift |
| ORM/DB Driver | psycopg2, pandas |

### Frontend

| Component | Technology |
|-----------|------------|
| Framework | React 18 with TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| HTTP Client | Axios |
| UI Components | Radix UI (shadcn/ui) |

---

## Project Structure

```
Visualization/
|
+-- backend/
|   +-- main.py                    # FastAPI application entry point
|   +-- cli.py                     # Command-line interface for testing
|   +-- requirements.txt           # Python dependencies
|   +-- .env                       # Environment variables (not in git)
|   |
|   +-- agents/
|   |   +-- langgraph_agent.py     # LangGraph workflow orchestrator
|   |   +-- llm_model_gemini.py    # SQL query generator using Gemini
|   |
|   +-- db/
|   |   +-- vector_db_store.py     # PGVector operations
|   |   +-- query_runner.py        # Redshift query execution
|   |   +-- create_embeddings.py   # Script to populate vector store
|   |   +-- table_descriptions_semantic.py  # Schema definitions
|   |   +-- safe_query_analyzer.py # SQL safety validation
|   |
|   +-- tools/
|       +-- extract_query.py       # SQL extraction utilities
|
+-- frontend/
    +-- src/
    |   +-- App.tsx                # Main application component
    |   +-- components/
    |   |   +-- ChatInterface.tsx  # Main chat UI container
    |   |   +-- ChatInput.tsx      # Message input component
    |   |   +-- ChatMessage.tsx    # Message bubble wrapper
    |   |   +-- BotMessage.tsx     # Bot response renderer
    |   |   +-- DataChart.tsx      # Chart visualization component
    |   |   +-- DataTable.tsx      # Data table component
    |   |   +-- CodeBlock.tsx      # SQL syntax highlighting
    |   |
    |   +-- services/
    |   |   +-- api.ts             # API client functions
    |   |
    |   +-- types/
    |       +-- chat.ts            # TypeScript interfaces
    |
    +-- package.json
    +-- vite.config.ts
    +-- tailwind.config.ts
```

---

## Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher (or Bun)
- PostgreSQL 14+ with pgvector extension
- Amazon Redshift cluster (or compatible database)
- Google Cloud account with Gemini API access

---

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   
   # Windows
   .venv\Scripts\activate
   
   # Linux/macOS
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## Configuration

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Google Gemini API
GOOGLE_API_KEY=your_google_api_key_here

# PostgreSQL Vector Database (for schema embeddings)
COLLECTION_NAME=my_collection
PGVECTOR_CONNECTION_STRING=postgresql+psycopg://user:password@localhost:5432/dbname
CONNECTION_STRING=postgresql://user:password@localhost:5432/dbname

# Amazon Redshift (data source)
REDSHIFT_HOST=your-cluster.region.redshift.amazonaws.com
REDSHIFT_PORT=5439
REDSHIFT_DBNAME=your_database
REDSHIFT_USER=your_user
REDSHIFT_PASSWORD=your_password
```

### Special Characters in Passwords

If your password contains special characters like `@`, URL-encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `:` becomes `%3A`

Example:
```env
CONNECTION_STRING=postgresql://postgres:Pass%40word123@localhost:5432/postgres
```

---

## Running the Application

### 1. Initialize the Vector Store (First Time Only)

Before running the chatbot, populate the vector database with schema embeddings:

```bash
cd backend
python -m db.create_embeddings
```

This reads table definitions from `db/table_descriptions_semantic.py` and stores their embeddings in PostgreSQL.

### 2. Start the Backend Server

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

### 3. Start the Frontend Development Server

```bash
cd frontend
npm run dev
# or
bun dev
```

The frontend will be available at `http://localhost:5173`.

---

## API Documentation

### Health Check

```
GET /health
```

Returns the status of all agent components.

**Response:**
```json
{
  "vector_store": true,
  "query_runner": true,
  "agent_ready": true
}
```

### Chat Endpoint

```
POST /chat
```

Processes a natural language query and returns SQL results with chart recommendations.

**Request Body:**
```json
{
  "question": "Show me total funded amount by loan product",
  "thread_id": "session-123"
}
```

**Response:**
```json
{
  "sql_query": "SELECT loanproductid, SUM(fundedamount) AS total_funded FROM fl_lms.loan_filters GROUP BY loanproductid",
  "data": [
    {"loanproductid": "ACHAdvance", "total_funded": 24898100},
    {"loanproductid": "MCABankCard", "total_funded": 867963}
  ],
  "record_count": 2,
  "chart_analysis": {
    "chartable": true,
    "reasoning": "Categorical data with numeric values - ideal for bar chart",
    "auto_chart": {
      "type": "bar",
      "title": "Total Funded Amount by Loan Product",
      "x_axis": "loanproductid",
      "y_axis": "total_funded",
      "reason": "Best for comparing values across categories"
    },
    "suggested_charts": [
      {"type": "pie", "title": "Distribution of Funded Amount", "confidence": 0.7}
    ]
  },
  "error": null
}
```

### Interactive API Documentation

When the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Frontend Components

### ChatInterface

The main container component that manages:
- Message state and history
- Thread ID for conversation context
- Loading states and error handling

### ChatInput

Handles user input with features:
- Multi-line text support (Shift+Enter for new line)
- Quick suggestion buttons
- Send button with loading state

### BotMessage

Renders assistant responses with three sections:
1. SQL Query (collapsible code block)
2. Data visualization (chart or table toggle)
3. Error messages (if applicable)

### DataChart

Transforms JSON data into Recharts-compatible format:
- Supports bar, line, pie, and doughnut charts
- Uses `auto_chart` configuration from API response
- Responsive design with color theming

### DataTable

Displays raw query results in a paginated table:
- Auto-generated column headers from data keys
- Scrollable for large datasets
- Toggle between chart and table view

---

## Workflow Pipeline

The LangGraph agent processes queries through these nodes:

```
[Start]
   |
   v
[1. Rewrite Question] -- Handles follow-up questions using chat history
   |
   v
[2. Schema Search] -- Semantic search for relevant columns in vector DB
   |
   v
[3. SQL Generation] -- Gemini LLM generates SQL query
   |
   v
[4. Query Validation] -- Safety check (no DROP, DELETE, UPDATE)
   |
   v
[5. Query Execution] -- Run against Redshift, return DataFrame
   |
   v
[6. Chart Analysis] -- LLM suggests visualization options
   |
   v
[End] -- Return structured response
```

### Error Handling and Retries

- If query execution fails, the workflow retries SQL generation (up to 3 times)
- Each node has error routing to a centralized error handler
- Errors are logged and returned to the user with context

---

## Database Schema Management

### Adding New Tables

1. Edit `backend/db/table_descriptions_semantic.py`
2. Add a new document with the table description:
   ```python
   Document(
       page_content="""
       Fields related to your_table (Category):
       - column_name: Description (data_type)
       - another_column: Description (data_type)
       """,
       metadata={"table_name": "your_table", "chunk_type": "category"}
   )
   ```
3. Update join_details if the table has relationships
4. Re-run the embedding script:
   ```bash
   python -m db.create_embeddings
   ```

### Schema Structure

The `db_structure` in `langgraph_agent.py` maps schemas to tables:

```python
db_structure = """
DATABASE STRUCTURE (Schema -> Tables):
Schema : fl_lms
contains tables : accrual_balances, loan_onboarding, loan_filters

Schema : public
contains tables : los_borrower_application, los_offer, los_address

Schema : cdp
contains tables : customerdataproductfinal
"""
```

Update this when adding new schemas or tables.

---

## Troubleshooting

### Common Issues

**1. Vector store not found**
```
Error: No existing vector store found
```
Solution: Run `python -m db.create_embeddings` to initialize the vector database.

**2. Redshift connection failed**
```
Error: Failed to connect to Redshift
```
Solution: Verify your Redshift credentials in `.env` and ensure the cluster is accessible from your network.

**3. Password authentication failed**
```
Error: password authentication failed for user "postgres"
```
Solution: Check your PostgreSQL password. If it contains special characters, URL-encode them.

**4. Chart analysis returns "Error"**
```
Chart Analysis: Error - Input to ChatPromptTemplate is missing variables
```
Solution: Ensure the LangGraph agent is using direct LLM invocation for chart analysis (not ChatPromptTemplate with unescaped curly braces).

**5. CORS errors in browser**
```
Access to XMLHttpRequest has been blocked by CORS policy
```
Solution: Verify the backend is running and CORS is configured in `main.py`. The current configuration allows all origins (`*`).

### Logs

Backend logs are printed to the console. For more verbose output:

```python
logging.basicConfig(level=logging.DEBUG)
```

---

## License

This project is proprietary software developed for Lendfoundry.

---

## Support

For issues or questions, contact the development team or open an issue in the repository.
