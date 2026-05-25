// Shared TypeScript interfaces used by ManagerService
export type { TaskModel } from '../models/Task';
export type { User } from '../models/User';


export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  rows: T[];
  count: number;
  totalPages: number;
  page: number;
  limit: number;
}


export interface ManagerTaskCreatePayload {
  documentId: string;
  memberId: string;
  title: string;
  description?: string;
  assignerId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  progress?: number;
  note?: string;
}

export interface ManagerTaskUpdatePayload {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  progress?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  note?: string;
  rejectionReason?: string | null;
}

export interface ManagerClericalReminderRequest {
  message: string;
  targetUserId?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
}

export interface ManagerClericalReminderResponse {
  id: string | number;
  taskId: string | number;
  message: string;
  senderId: string | number;
  senderName: string;
  targetRole: 'CLERICAL';
  targetUserId?: string | number | null;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  read?: boolean;
  createdAt: string;
}
