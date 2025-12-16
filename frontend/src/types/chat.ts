export interface ChartAnalysis {
  chartable: boolean;
  reasoning: string;
  auto_chart?: {
    type: 'bar' | 'line' | 'pie' | 'doughnut';
    title: string;
    x_axis: string;
    y_axis?: string;
  };
}

export interface ApiResponse {
  sql_query: string;
  data: Record<string, unknown>[];
  chart_analysis: ChartAnalysis;
  error: string | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response?: ApiResponse;
  isLoading?: boolean;
}
