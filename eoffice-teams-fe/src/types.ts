
export type Role = 'VanThu' | 'LanhDao' | 'TruongPhong' | 'ChuyenVien' | 'QuanTri';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  email: string;
}

export interface DocumentTask {
  id: string;
  title: string;
  sender: string;
  date: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Rejected' | 'Urgent';
  type: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  summary?: string;
  aiSuggestedRole?: string;
  leadTime?: string;
}

export interface KPIStats {
  totalDocs: number;
  pendingApprovals: number;
  processingTime: string;
  efficiency: number;
}
