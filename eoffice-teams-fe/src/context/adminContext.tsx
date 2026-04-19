
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Role } from '../types';

// Các kiểu dữ liệu
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  status: 'Active' | 'Inactive';
  teamsStatus?: 'Available' | 'Busy' | 'Offline' | 'Away';
  avatar?: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RoleConfig {
  role: Role;
  permissions: string[]; // List of permission ids
}

export interface SystemConfig {
  workingHours: { start: string; end: string };
  holidays: string[];
  aiCopilotEnabled: boolean;
  notificationFrequency: 'High' | 'Medium' | 'Low';
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  approverRole: Role;
}

export interface AdminState {
  users: UserRecord[];
  rolesConfig: RoleConfig[];
  systemConfig: SystemConfig;
  auditLogs: AuditLog[];
  workflows: WorkflowStep[];
}

interface AdminContextType extends AdminState {
  addUser: (user: Omit<UserRecord, 'id'>) => void;
  updateUser: (id: string, updates: Partial<UserRecord>) => void;
  deleteUser: (id: string) => void;
  updateRolePermissions: (role: Role, permissions: string[]) => void;
  updateSystemConfig: (config: Partial<SystemConfig>) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const initialUsers: UserRecord[] = [
  { id: '1', name: 'Nguyễn Văn A', email: 'vana@company.com', role: 'LanhDao', department: 'Hội đồng quản trị', status: 'Active', teamsStatus: 'Available' },
  { id: '2', name: 'Trần Thị B', email: 'thib@company.com', role: 'VanThu', department: 'Hành chính', status: 'Active', teamsStatus: 'Busy' },
  { id: '3', name: 'Lê Văn C', email: 'vanc@company.com', role: 'TruongPhong', department: 'Kế hoạch', status: 'Active', teamsStatus: 'Away' },
  { id: '4', name: 'Phạm Văn D', email: 'vand@company.com', role: 'ChuyenVien', department: 'Kỹ thuật', status: 'Inactive', teamsStatus: 'Offline' },
];

const initialRolesConfig: RoleConfig[] = [
  { role: 'LanhDao', permissions: ['1', '2', '3'] },
  { role: 'VanThu', permissions: ['1', '4'] },
  { role: 'TruongPhong', permissions: ['1', '2'] },
  { role: 'ChuyenVien', permissions: ['1'] },
  { role: 'QuanTri', permissions: ['1', '2', '3', '4', '5'] },
];

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [rolesConfig, setRolesConfig] = useState<RoleConfig[]>(initialRolesConfig);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    workingHours: { start: '08:00', end: '17:30' },
    holidays: ['2024-01-01', '2024-04-30', '2024-05-01'],
    aiCopilotEnabled: true,
    notificationFrequency: 'Medium',
  });
  const [auditLogs] = useState<AuditLog[]>([
    { id: '1', user: 'Admin', action: 'Update Role', target: 'Leader', timestamp: '2024-03-20 10:00:00' },
    { id: '2', user: 'Admin', action: 'Create User', target: 'Nguyễn Văn A', timestamp: '2024-03-20 09:30:00' },
  ]);
  const [workflows] = useState<WorkflowStep[]>([
    { id: '1', name: 'Khởi tạo', approverRole: 'VanThu' },
    { id: '2', name: 'Duyệt cấp phòng', approverRole: 'TruongPhong' },
    { id: '3', name: 'Phê duyệt cuối', approverRole: 'LanhDao' },
  ]);

  const addUser = (user: Omit<UserRecord, 'id'>) => {
    const newUser = { ...user, id: Math.random().toString(36).substr(2, 9) };
    setUsers([...users, newUser]);
  };

  const updateUser = (id: string, updates: Partial<UserRecord>) => {
    setUsers(users.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const updateRolePermissions = (role: Role, permissions: string[]) => {
    setRolesConfig(rolesConfig.map(rc => rc.role === role ? { ...rc, permissions } : rc));
  };

  const updateSystemConfig = (updates: Partial<SystemConfig>) => {
    setSystemConfig({ ...systemConfig, ...updates });
  };

  return (
    <AdminContext.Provider value={{
      users, rolesConfig, systemConfig, auditLogs, workflows,
      addUser, updateUser, deleteUser, updateRolePermissions, updateSystemConfig
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
};
