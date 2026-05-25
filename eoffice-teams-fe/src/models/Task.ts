import { User } from './User.ts';
import { Document } from './Document';
import { Department } from './Department.ts';

export interface TaskMemberUser {
  id: string;
  fullName?: string;
  email?: string;
}

export interface TaskMember {
  id: string;
  departmentId?: string | null;
  userId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: TaskMemberUser;
}

export interface TaskAssigner {
  id: string;
  fullName?: string;
  email?: string;
}

export interface TaskFile {
  id: string;
  taskId?: string;
  nameFile: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
}


export interface TaskLeader {
  id: string;
  document?: Document;
  department?: Department;
  note?: string;
  deadline?: string;
  updateAt?: Date;
}

export interface TaskModel{
  id: string;
  documentId?: string;
  document?: Document;
  departmentId?: string;
  memberId?: string;
  assigneeId?: string | null;
  assignerId?: string | null;
  title: string;
  description?: string;
  assignee?: User;
  assigner?: User;
  member?: TaskMember;
  sender?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  assignerName?: string;
  assignerEmail?: string;
  documentNumber?: string;
  departmentName?: string;
  status: 'Todo' | 'Doing' | 'UnderReview' | 'Rejected' | 'Done' | 'Completed' | 'Overdue';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  deadline?: string;
  createdAt?: string;
  updatedAt?: string;
  progress?: number;
  isOverdue?: boolean;
  note?: string;
  rejectionReason?: string | null;
  aiSummary?: string;
  files?: TaskFile[];
  attachments?: string[];

}