import { useState } from 'react';
import { BarChart3, Table, AlertCircle, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { Message } from '@/types/chat';
import { CodeBlock } from './CodeBlock';
import { DataChart } from './DataChart';
import { DataTable } from './DataTable';
import { cn } from '@/lib/utils';

interface BotMessageProps {
  message: Message;
}

export function BotMessage({ message }: BotMessageProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [showReasoning, setShowReasoning] = useState(false);

  if (!message.response) {
    return (
      <div className="text-foreground">
        {message.content}
      </div>
    );
  }

  const { sql_query, data, chart_analysis, error } = message.response;

  // Error state
  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-destructive">Error</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const hasData = data && data.length > 0;
  const isChartable = chart_analysis?.chartable && chart_analysis?.auto_chart;

  return (
    <div className="space-y-4">
      {/* SQL Query Section */}
      {sql_query && (
        <CodeBlock 
          code={sql_query} 
          language="sql" 
          title="Generated SQL Query"
          defaultCollapsed={false}
        />
      )}

      {/* Chart Analysis Reasoning */}
      {chart_analysis?.reasoning && (
        <button
          onClick={() => setShowReasoning(!showReasoning)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Database size={14} />
          <span>Analysis Reasoning</span>
          {showReasoning ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}
      
      {showReasoning && chart_analysis?.reasoning && (
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm text-muted-foreground animate-fade-in">
          {chart_analysis.reasoning}
        </div>
      )}

      {/* Data Visualization Section */}
      {hasData && (
        <div className="rounded-lg border border-border bg-card/40 overflow-hidden">
          {/* View Toggle Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <span className="text-sm font-medium text-foreground">
              Results ({data.length} {data.length === 1 ? 'row' : 'rows'})
            </span>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
              {isChartable && (
                <button
                  onClick={() => setViewMode('chart')}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    viewMode === 'chart'
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <BarChart3 size={14} />
                  Chart
                </button>
              )}
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'table' || !isChartable
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Table size={14} />
                Table
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="animate-fade-in">
            {viewMode === 'chart' && isChartable ? (
              <DataChart data={data} chartAnalysis={chart_analysis} />
            ) : (
              <div className="p-4">
                <DataTable data={data} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasData && !error && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          No records found for this query
        </div>
      )}
    </div>
  );
}
