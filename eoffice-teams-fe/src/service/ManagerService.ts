import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { KPIStats, MemberModel, TaskModel } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ManagerTaskDocumentDto {
  id: string | number;
  documentNumber?: string;
  symbol?: string;
  title?: string;
  sender?: string;
  status?: string;
  urgency?: string;
  priority?: string | null;
  description?: string | null;
  summary?: string;
  legalWarning?: boolean;
  createdAt?: string;
  updatedAt?: string;
  files?: Array<{
    id: string | number;
    nameFile?: string;
    url?: string;
  }>;
}

interface ManagerTaskDepartmentDto {
  id: string | number;
  code?: string;
  name?: string;
  managerId?: string | number;
  managerName?: string;
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

interface ManagerDepartmentTaskDto {
  id: string | number;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  department?: ManagerTaskDepartmentDto;
  document?: ManagerTaskDocumentDto;
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

  if (normalized === 'DOING' || normalized === 'APPROVED' || normalized === 'PROCESSING' || normalized === 'WAITING_PUBLISH') {
    return 'Doing';
  }

  if (normalized === 'COMPLETED' || normalized === 'PUBLISHED') return 'Completed';
  if (normalized === 'OVERDUE' || normalized === 'REJECTED') return 'Overdue';

  return 'Todo';
};

const normalizePriority = (priority?: string, urgency?: string): TaskModel['priority'] => {
  const normalizedPriority = (priority ?? '').toUpperCase();
  const normalizedUrgency = (urgency ?? '').toUpperCase();

  if (normalizedPriority === 'CRITICAL' || normalizedUrgency === 'HỎA TỐC' || normalizedUrgency === 'HOA TOC') return 'Critical';
  if (normalizedPriority === 'HIGH' || normalizedUrgency === 'KHẨN' || normalizedUrgency === 'KHAN') return 'High';
  if (normalizedPriority === 'MEDIUM') return 'Medium';

  return 'Low';
};

const mapDepartmentTaskDto = (item: ManagerDepartmentTaskDto): TaskModel => {
  const document = item.document;
  const attachments = document?.files?.map((file) => file.nameFile ?? String(file.id)).filter(Boolean) ?? [];
  const fallbackDate = document?.updatedAt || document?.createdAt || item.updatedAt || item.createdAt || '';

  return {
    id: String(item.id),
    title: document?.title ?? 'Chưa có tiêu đề',
    description: document?.description ?? document?.summary ?? undefined,
    sender: document?.sender ?? 'N/A',
    status: normalizeStatus(document?.status),
    priority: normalizePriority(document?.priority ?? undefined, document?.urgency),
    deadline: fallbackDate,
    createdAt: item.createdAt ?? document?.createdAt,
    aiSummary: document?.summary,
    attachments,
    departmentName: item.department?.name ?? '',
    documentNumber: document?.documentNumber,
    documentStatus: document?.status,
    note: item.note,
  };
};

const mapTaskDto = (task: ManagerDepartmentTaskDto): TaskModel => mapDepartmentTaskDto(task);

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
  // Lấy danh sách task của manager hiện tại.
  getMyTasks: async (managerId?: string): Promise<TaskModel[]> => {
    const url = managerId
      ? `${ENDPOINTS.MANAGER.MY_TASKS}?userId=${encodeURIComponent(managerId)}`
      : ENDPOINTS.MANAGER.MY_TASKS;

      console.log(url);

    const response = await axiosClient.get(url);
    const payload = response.data as ApiResponse<ManagerDepartmentTaskDto[]>;
    return (payload.data ?? []).map(mapTaskDto);
  },

  // Alias cũ để tránh vỡ các chỗ gọi khác trong app.
  getAssignedTasksByDepartment: async (managerId: string): Promise<TaskModel[]> => {
    return managerService.getMyTasks(managerId);
  },

  // Lấy danh sách task phụ của phòng.
  getSubTasks: async (departmentId?: string): Promise<TaskModel[]> => {
    const url = departmentId
      ? `${ENDPOINTS.MANAGER.SUB_TASKS}?departmentId=${encodeURIComponent(departmentId)}`
      : ENDPOINTS.MANAGER.SUB_TASKS;

    const response = await axiosClient.get(url);
    const payload = response.data as ApiResponse<ManagerTaskDto[]>;
    return (payload.data ?? []).map((task) => ({
      id: String(task.id),
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
    }));
  },

  // Lấy danh sách thành viên phòng.
  // getDepartmentMembers: async (): Promise<MemberModel[]> => {
  //   const response = await axiosClient.get(ENDPOINTS.MANAGER.MEMBERS);
  //   const payload = response.data as ApiResponse<MemberDto[]>;
  //   return (payload.data ?? []).map(mapMemberDto);
  // },

  // Phân task cho thành viên.
  // assignTaskToMember: async (task: Partial<TaskModel>): Promise<boolean> => {
  //   const response = await axiosClient.post(ENDPOINTS.MANAGER.ASSIGN_TASK, task);
  //   const payload = response.data as ApiResponse<null>;
  //   return payload.success;
  // },

  // // Cập nhật trạng thái task.
  // updateTaskStatus: async (taskId: string, status: TaskModel['status']): Promise<boolean> => {
  //   const response = await axiosClient.post(ENDPOINTS.MANAGER.UPDATE_TASK_STATUS, { taskId, status });
  //   const payload = response.data as ApiResponse<null>;
  //   return payload.success;
  // },

  // // Thống kê hiệu suất phòng.
  // getManagementStats: async (): Promise<KPIStats> => {
  //   const response = await axiosClient.get(ENDPOINTS.MANAGER.STATS);
  //   const payload = response.data as ApiResponse<KPIStats>;
  //   return payload.data ?? {
  //     totalDocs: 0,
  //     pendingApprovals: 0,
  //     processingTime: '0 ngày',
  //     efficiency: 0,
  //   };
  // },
};
