export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  created_at: Date;
}