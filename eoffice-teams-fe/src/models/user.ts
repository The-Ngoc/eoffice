// Định nghĩa các Role có trong hệ thống của bạn
export type Role = 'ADMIN' | 'LEADER' | 'SPECIALIST' | 'CLERICAL' | 'MANAGER';

// Định nghĩa cấu trúc User khớp với MySQL của Ngọc
export interface User {
  id: string;          // Cái chuỗi ID dài từ Microsoft
  fullName: string;
  role: Role;
  email?: string;     // Thêm trường email nếu cần
}

// // Định nghĩa cấu trúc phản hồi từ API Backend
// export interface ApiResponse<T> {
//   success: boolean;
//   data: T;
//   message?: string;
// }