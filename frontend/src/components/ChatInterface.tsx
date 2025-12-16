import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Database, Zap } from 'lucide-react';
import { Message } from '@/types/chat';
import { sendChatMessage } from '@/services/api';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { useToast } from '@/hooks/use-toast';

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId] = useState(() => uuidv4());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(content, threadId);

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.error ? 'An error occurred while processing your query.' : 'Here are the results:',
        timestamp: new Date(),
        response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      toast({
        title: "Connection Error",
        description: "Could not connect to the server. Please ensure the backend is running on localhost:8000",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Failed to connect to the server.',
        timestamp: new Date(),
        response: {
          sql_query: '',
          data: [],
          chart_analysis: { chartable: false, reasoning: '' },
          error: 'Could not connect to the server. Please ensure the backend is running on localhost:8000',
        },
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">SQL Assistant</h1>
              <p className="text-xs text-muted-foreground">Natural language to SQL & Visualization</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Zap size={14} className="text-primary" />
            <span className="text-xs font-medium text-primary">AI Powered</span>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-glow">
                <Database className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Ask anything about your data
              </h2>
              <p className="text-muted-foreground max-w-md mb-8">
                I can help you query your database using natural language and visualize the results 
                with interactive charts and tables.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                {[
                  "Show total revenue by month",
                  "Top 10 products by sales",
                  "Customer growth trend",
                  "Compare Q1 vs Q2 performance",
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(example)}
                    className="px-4 py-3 text-sm text-left rounded-xl bg-card/60 border border-border/50 
                               hover:bg-muted hover:border-border transition-all text-muted-foreground 
                               hover:text-foreground group"
                  >
                    <span className="text-primary mr-2"></span>
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
