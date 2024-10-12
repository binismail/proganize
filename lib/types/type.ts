export interface Document {
  id: string;
  title?: string;
  content?: string;
  conversation?: string[];
  updated_at?: string;
  created_at: string;
  // Add other properties as needed
}

interface GroupedDocuments {
  Today: Document[];
  Yesterday: Document[];
  "This Week": Document[];
  Earlier: Document[];
}
