import { User } from './User.ts';

export interface Department {
  id: string;
  name: string;
  managerId: string;
  managerName: string;
  code?: string;
}

export interface DepartmentMember {
  id: string;
  departmentId: string;
  userId: string;
  user: User;
  department: Department;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}