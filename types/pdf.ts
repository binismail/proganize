export interface PDFConversation {
  id: string;
  user_id: string;
  title: string;
  pdf_url: string;
  pdf_name: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  created_at?: string;
  conversation_id?: string;
}
