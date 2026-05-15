
export type Role = 'ADMIN' | 'CLERICAL' | 'LEADER' | 'MANAGER' | 'SPECIALIST';

export interface User {
  id: string;
  fullName: string;
  name?: string;
  role: Role;
  avatar?: string;
  email?: string;
}

export interface DocumentTask {
  id: string;
  title: string;
  sender: string;
  date: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Rejected' | 'Urgent';
  type: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  summary?: string;
  aiSuggestedRole?: string;
  leadTime?: string;
  content?: string;
  legalWarnings?: string[];
}

export interface KPIStats {
  totalDocs: number;
  pendingApprovals: number;
  processingTime: string;
  efficiency: number;
}

export interface Department {
  id: string;
  name: string;
  managerId: string;
  managerName: string;
}

export interface LeaderDeptPerformance {
  name: string;
  value: number;
}

export interface TaskModel {
  id: string;
  parentId?: string;
  title: string;
  description?: string;
  sender: string;
  status: 'Todo' | 'Doing' | 'Completed' | 'Overdue';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  deadline: string;
  createdAt?: string;
  assigneeId?: string;
  aiSummary?: string;
  attachments?: string[];
}

export interface MemberModel {
  id: string;
  name: string;
  role: string;
  avatar: string;
  departmentId: string;
  completedTasks: number;
  totalTasks: number;
}

export interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  platform: 'Teams' | 'eOffice';
  isOnline: boolean;
  joinUrl: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  mentions?: string[];
}
