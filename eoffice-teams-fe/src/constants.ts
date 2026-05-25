
import { Role, User } from './models/User.ts';

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


