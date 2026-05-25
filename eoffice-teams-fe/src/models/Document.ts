
export interface DocumentFile {
  id: string | number;
  file_name: string;
  file_url: string;
}

export interface DocumentFlowHistoryItem {
  id: string;
  status: 'Create' | 'Pending' | 'Processing' | 'Completed' | 'Rejected' | 'Urgent' | 'Done';
  action: string;
  note: string | null;
  processedAt?: string | Record<string, unknown> | null;
  createdAt?: string | Record<string, unknown> | null;
  updatedAt?: string | Record<string, unknown> | null;
}



export interface Document {
  id: string;
  documentNumber?: string;
  symbol?: string;
  title?: string;
  sender?: string;
  type?: string;
  dueDate?: string;
  status?: 'Create' | 'Pending' | 'Processing' | 'Completed' | 'Rejected' | 'Urgent' | 'Done';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  urgency?: string;
  createdAt?: string;
  description?: string;
  summary?: string;
  legalWarning?: boolean;
  departmentName?: string;
  files?: DocumentFile[];
  flowHistory?: DocumentFlowHistoryItem[];
  updatedAt?: string;
}
