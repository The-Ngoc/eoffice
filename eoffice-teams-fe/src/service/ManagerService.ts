import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { KPIStats, MemberModel, TaskModel } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ManagerTaskDto {
  id: string | number;
  parentId?: string | number;
  title?: string;
  description?: string;
  sender?: string;
  status?: string;
  priority?: string;
  deadline?: string;
  createdAt?: string;
  assigneeId?: string | number;
  aiSummary?: string;
  attachments?: string[];
}

interface MemberDto {
  id: string | number;
  name?: string;
  role?: string;
  avatar?: string;
  departmentId?: string | number;
  completedTasks?: number;
  totalTasks?: number;
}

const normalizeStatus = (status?: string): TaskModel['status'] => {
  const normalized = (status ?? '').toUpperCase();

  if (normalized === 'DOING') return 'Doing';
  if (normalized === 'WAITING_APPROVAL') return 'UnderReview';
  if (normalized === 'REJECTED') return 'Rejected';
  if (normalized === 'DONE' || normalized === 'COMPLETED') return 'Completed';
  if (normalized === 'OVERDUE') return 'Overdue';

  return 'Todo';
};

const normalizePriority = (priority?: string): TaskModel['priority'] => {
  const normalized = (priority ?? '').toUpperCase();

  if (normalized === 'CRITICAL') return 'Critical';
  if (normalized === 'HIGH') return 'High';
  if (normalized === 'MEDIUM') return 'Medium';

  return 'Low';
};

const mapTaskDto = (task: ManagerTaskDto): TaskModel => ({
  id: String(task.id),
  parentId: task.parentId ? String(task.parentId) : undefined,
  title: task.title ?? 'Chưa có tiêu đề',
  description: task.description,
  sender: task.sender ?? 'N/A',
  status: normalizeStatus(task.status),
  priority: normalizePriority(task.priority),
  deadline: task.deadline ?? '',
  createdAt: task.createdAt,
  assigneeId: task.assigneeId ? String(task.assigneeId) : undefined,
  aiSummary: task.aiSummary,
  attachments: task.attachments ?? [],
});

const mapMemberDto = (member: MemberDto): MemberModel => ({
  id: String(member.id),
  name: member.name ?? 'N/A',
  role: member.role ?? '',
  avatar: member.avatar ?? 'https://i.pravatar.cc/150',
  departmentId: String(member.departmentId ?? ''),
  completedTasks: member.completedTasks ?? 0,
  totalTasks: member.totalTasks ?? 0,
});

export const managerService = {
  // Lấy danh sách nhiệm vụ do Leader giao cho phòng.
  getAssignedTasks: async (): Promise<TaskModel[]> => {
    const response = await axiosClient.get(ENDPOINTS.MANAGER.ASSIGNED_TASKS);
    const payload = response.data as ApiResponse<ManagerTaskDto[]>;
    return (payload.data ?? []).map(mapTaskDto);
  },

  // Lấy danh sách task con đã phân công.
  getSubTasks: async (parentId?: string): Promise<TaskModel[]> => {
    const url = parentId
      ? `${ENDPOINTS.MANAGER.SUB_TASKS}?parentId=${encodeURIComponent(parentId)}`
      : ENDPOINTS.MANAGER.SUB_TASKS;

    const response = await axiosClient.get(url);
    const payload = response.data as ApiResponse<ManagerTaskDto[]>;
    return (payload.data ?? []).map(mapTaskDto);
  },

  // Lấy danh sách thành viên phòng.
  getDepartmentMembers: async (): Promise<MemberModel[]> => {
    const response = await axiosClient.get(ENDPOINTS.MANAGER.MEMBERS);
    const payload = response.data as ApiResponse<MemberDto[]>;
    return (payload.data ?? []).map(mapMemberDto);
  },

  // Phân task cho thành viên.
  assignTaskToMember: async (task: Partial<TaskModel>): Promise<boolean> => {
    const response = await axiosClient.post(ENDPOINTS.MANAGER.ASSIGN_TASK, task);
    const payload = response.data as ApiResponse<null>;
    return payload.success;
  },

  // Cập nhật trạng thái task.
  updateTaskStatus: async (taskId: string, status: TaskModel['status']): Promise<boolean> => {
    const statusMap = {
      Todo: 'TODO',
      Doing: 'DOING',
      UnderReview: 'WAITING_APPROVAL',
      Rejected: 'REJECTED',
      Completed: 'DONE',
      Overdue: 'OVERDUE',
    } as const;

    const response = await axiosClient.post(ENDPOINTS.MANAGER.UPDATE_TASK_STATUS, { taskId, status: statusMap[status] ?? status });
    const payload = response.data as ApiResponse<null>;
    return payload.success;
  },

  // Thống kê hiệu suất phòng.
  getManagementStats: async (): Promise<KPIStats> => {
    const response = await axiosClient.get(ENDPOINTS.MANAGER.STATS);
    const payload = response.data as ApiResponse<KPIStats>;
    return payload.data ?? {
      totalDocs: 0,
      pendingApprovals: 0,
      processingTime: '0 ngày',
      efficiency: 0,
    };
  },
};
