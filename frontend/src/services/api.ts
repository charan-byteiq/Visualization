import axios from 'axios';
import { ApiResponse } from '@/types/chat';

const API_BASE_URL = 'http://localhost:8000';

export async function sendChatMessage(question: string, threadId: string): Promise<ApiResponse> {
  const response = await axios.post<ApiResponse>(`${API_BASE_URL}/chat`, {
    question,
    thread_id: threadId,
  });
  return response.data;
}
