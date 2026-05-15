
import { User, DocumentTask, Role } from './types';

export const TEAMS_PURPLE = '#6264A7';
export const TEAMS_BG = '#F5F5F5';
export const TEAMS_DARK = '#242424';

export const ROLES: { value: Role; label: string; description: string }[] = [
  { value: 'CLERICAL', label: 'Văn thư', description: 'Tiếp nhận, bóc tách và lưu trữ văn bản' },
  { value: 'LEADER', label: 'Lãnh đạo', description: 'Phê duyệt, chỉ đạo và theo dõi KPI' },
  { value: 'MANAGER', label: 'Trưởng phòng', description: 'Quản lý task, phân công chuyên viên' },
  { value: 'SPECIALIST', label: 'Chuyên viên', description: 'Xử lý hồ sơ, soạn thảo văn bản' },
  { value: 'ADMIN', label: 'Quản trị', description: 'Quản lý người dùng và hệ thống' },
];

export const MOCK_USERS: Record<Role, User> = {
  CLERICAL: { id: 'u1', name: 'Nguyễn Văn Thư', role: 'CLERICAL', avatar: 'https://i.pravatar.cc/150?u=vanthu', email: 'vanthu@eoffice.com' },
  LEADER: { id: 'u2', name: 'Trần Lãnh Đạo', role: 'LEADER', avatar: 'https://i.pravatar.cc/150?u=lanhdao', email: 'director@eoffice.com' },
  MANAGER: { id: 'u3', name: 'Lê Trưởng Phòng', role: 'MANAGER', avatar: 'https://i.pravatar.cc/150?u=manager', email: 'manager@eoffice.com' },
  SPECIALIST: { id: 'u4', name: 'Phạm Chuyên Viên', role: 'SPECIALIST', avatar: 'https://i.pravatar.cc/150?u=staff', email: 'staff@eoffice.com' },
  ADMIN: { id: 'u5', name: 'Bùi Quản Trị', role: 'ADMIN', avatar: 'https://i.pravatar.cc/150?u=admin', email: 'admin@eoffice.com' },
};

export const MOCK_TASKS: DocumentTask[] = [
  { id: 'DOC-001', title: 'Công văn đề nghị phê duyệt dự án X', sender: 'Phòng Kỹ thuật', date: '2024-03-20', status: 'Pending', type: 'Công văn', priority: 'High', summary: 'Đề xuất ngân sách 5 tỷ cho hạ tầng mạng.' },
  { id: 'DOC-002', title: 'Báo cáo tổng kết quý 1 - 2024', sender: 'Phòng Tài chính', date: '2024-03-19', status: 'Processing', type: 'Báo cáo', priority: 'Medium', summary: 'Tình hình tài chính ổn định, tăng trưởng 12%.' },
  { id: 'DOC-003', title: 'Tờ trình tuyển dụng nhân sự mới', sender: 'Phòng Nhân sự', date: '2024-03-18', status: 'Urgent', type: 'Tờ trình', priority: 'Critical', summary: 'Cần tuyển 3 lập trình viên Senior phục vụ dự án AI.' },
  { id: 'DOC-004', title: 'Nghị quyết hội đồng quản trị số 12', sender: 'Hội đồng quản trị', date: '2024-03-17', status: 'Completed', type: 'Nghị quyết', priority: 'Low' },
  { id: 'DOC-005', title: 'Kế hoạch triển khai eOffice', sender: 'Ban dự án', date: '2024-03-16', status: 'Pending', type: 'Kế hoạch', priority: 'Medium', summary: 'Đào tạo nhân sự sử dụng Microsoft Teams tích hợp eOffice.' },
];
