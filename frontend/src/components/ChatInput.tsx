import { useState, FormEvent, KeyboardEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestions = [
    "Show me total sales by product category",
    "What are the top 5 customers by revenue?",
    "Compare monthly sales for 2024",
  ];

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Quick Suggestions */}
        {input.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInput(suggestion)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full 
                           bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground 
                           transition-colors border border-border/50"
              >
                <Sparkles size={12} className="text-primary" />
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your data..."
              disabled={isLoading}
              rows={1}
              className={cn(
                "w-full resize-none rounded-xl border border-border bg-secondary/50 px-4 py-3",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                "min-h-[48px] max-h-[120px]"
              )}
              style={{
                height: 'auto',
                minHeight: '48px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
              "transition-all duration-200",
              "shadow-glow"
            )}
          >
            <Send size={18} />
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}
