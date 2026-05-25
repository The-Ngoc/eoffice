// Định nghĩa các Role có trong hệ thống của bạn
export type Role = 'ADMIN' | 'LEADER' | 'SPECIALIST' | 'CLERICAL' | 'MANAGER';

// Định nghĩa cấu trúc User khớp với MySQL của Ngọc
export interface User {
  id: string;          
  fullName: string;
  role: Role;
  email?: string;     
}
