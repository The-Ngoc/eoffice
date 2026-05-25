import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { TaskModel ,TaskLeader } from '../models/Task';
import type {
  ApiResponse,
  PaginatedResponse,
  ManagerTaskCreatePayload,
  ManagerTaskUpdatePayload,
  ManagerClericalReminderRequest,
  ManagerClericalReminderResponse,
} from '../models/Manager';

const normalizeStatus = (status?: string): TaskModel['status'] => {
  const normalized = (status ?? '').toUpperCase();

  if (normalized === 'DOING' || normalized === 'APPROVED' || normalized === 'PROCESSING' || normalized === 'WAITING_PUBLISH' || normalized === 'IN_PROGRESS') return 'Doing';
  if (normalized === 'WAITING_APPROVAL' || normalized === 'UNDER_REVIEW') return 'UnderReview';
  if (normalized === 'REJECTED') return 'Rejected';
  if (normalized === 'DONE' || normalized === 'COMPLETED') return 'Completed';
  if (normalized === 'OVERDUE') return 'Overdue';

  return 'Todo';
};

const normalizePriority = (priority?: string, urgency?: string): TaskModel['priority'] => {
  const normalizedPriority = (priority ?? '').toUpperCase();
  const normalizedUrgency = (urgency ?? '').toUpperCase();

  if (normalizedPriority === 'URGENT' || normalizedPriority === 'CRITICAL' || normalizedUrgency === 'HỎA TỐC' || normalizedUrgency === 'HOA TOC') return 'Critical';
  if (normalizedPriority === 'HIGH' || normalizedUrgency === 'KHẨN' || normalizedUrgency === 'KHAN') return 'High';
  if (normalizedPriority === 'MEDIUM') return 'Medium';

  return 'Low';
};

const normalizeResponseList = <T>(responseData: ApiResponse<T[] | PaginatedResponse<T>>): T[] => {
  if (Array.isArray(responseData.data)) {
    return responseData.data;
  }

  return responseData.data?.rows ?? [];
};

const buildTaskListUrl = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  memberId?: string;
  documentId?: string;
}) => {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.priority) searchParams.set('priority', params.priority);
  if (params?.memberId) searchParams.set('memberId', params.memberId);
  if (params?.documentId) searchParams.set('documentId', params.documentId);

  const query = searchParams.toString();
  return query ? `${ENDPOINTS.MANAGER.TASKS}?${query}` : ENDPOINTS.MANAGER.TASKS;
};

// mapTaskDepartmentDto intentionally removed.

export const managerService = {
  getMyTasks: async (managerId?: string): Promise<TaskLeader[]> => {
    const url = managerId
      ? `${ENDPOINTS.MANAGER.DEPARTMENT_TASKS}?userId=${encodeURIComponent(managerId)}`
      : ENDPOINTS.MANAGER.DEPARTMENT_TASKS;

    const response = await axiosClient.get(url);
    const payload = response.data as ApiResponse<TaskLeader[] | PaginatedResponse<TaskLeader>>;
    const items = normalizeResponseList<TaskLeader>(payload);
    return items;
  },

  getAssignedTasks: async (managerId: string): Promise<TaskModel[]> => {
    const response = await axiosClient.get(buildTaskListUrl({ limit: 1000 }));
    const payload = response.data as ApiResponse<TaskModel[] | PaginatedResponse<TaskModel>>;
    const rows = normalizeResponseList<TaskModel>(payload);

    return rows.filter((task) => String(task.assignerId ?? task.assigner?.id ?? '') === String(managerId));
  },

  getTasksByDocumentId: async (documentId: string): Promise<TaskModel[]> => {
    const response = await axiosClient.get(buildTaskListUrl({ limit: 1000, documentId }));
    const payload = response.data as ApiResponse<TaskModel[] | PaginatedResponse<TaskModel>>;
    return normalizeResponseList<TaskModel>(payload);
  },

  getTaskById: async (taskId: string): Promise<TaskModel | null> => {
    const response = await axiosClient.get(
      ENDPOINTS.MANAGER.TASK_DETAIL.replace(':taskId', encodeURIComponent(taskId)),
    );
    const payload = response.data as ApiResponse<TaskModel>;
    return payload.data ?? null;
  },




  getTasksByMember: async (memberId: string, params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<TaskModel>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    const url = query
      ? `${ENDPOINTS.MANAGER.TASKS_BY_MEMBER}/${encodeURIComponent(memberId)}?${query}`
      : `${ENDPOINTS.MANAGER.TASKS_BY_MEMBER}/${encodeURIComponent(memberId)}`;

    const response = await axiosClient.get(url);
    const payload = response.data as ApiResponse<PaginatedResponse<TaskModel>>;

    const data = payload.data ?? {
      rows: [],
      count: 0,
      totalPages: 0,
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
    };

    return {
      ...data,
      rows: data.rows ?? [],
    };
  },

  createTask: async (payload: ManagerTaskCreatePayload, files: File[] = []): Promise<TaskModel | null> => {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });

    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await axiosClient.post(ENDPOINTS.MANAGER.CREATE_TASK, formData);
    const data = response.data as ApiResponse<TaskModel>;
    return data.data ?? null;
  },

  updateTask: async (taskId: string, payload: ManagerTaskUpdatePayload): Promise<TaskModel | null> => {
    const response = await axiosClient.patch(`${ENDPOINTS.MANAGER.TASKS}/${encodeURIComponent(taskId)}`, payload);
    const data = response.data as ApiResponse<TaskModel>;
    return data.data ?? null;
  },

  updateTaskStatus: async (taskId: string, status: TaskModel['status']): Promise<boolean> => {
    const statusMap = {
      Todo: 'TODO',
      Doing: 'IN_PROGRESS',
      UnderReview: 'IN_PROGRESS',
      Rejected: 'REJECTED',
      Done: 'COMPLETED',
      Completed: 'COMPLETED',
      Overdue: 'CANCELLED',
    } as const;

    const response = await axiosClient.patch(`${ENDPOINTS.MANAGER.TASKS}/${encodeURIComponent(taskId)}`, { status: statusMap[status] ?? 'TODO' });
    const payload = response.data as ApiResponse<TaskLeader>;
    return Boolean(payload.success);
  },

  updateDocumentApproved: async (documentId: string): Promise<boolean> => {
    const response = await axiosClient.put(ENDPOINTS.DOCUMENTS.UPDATE_STATUS, {
      id: documentId,
      status: 'APPROVED',
    });
    const payload = response.data as ApiResponse<{ id?: string; message?: string }>;
    console.log('Document approval response:', payload);
    return Boolean(payload.success);
  },

  deleteTask: async (taskId: string): Promise<boolean> => {
    const response = await axiosClient.delete(`${ENDPOINTS.MANAGER.TASKS}/${encodeURIComponent(taskId)}`);
    const payload = response.data as ApiResponse<{ message?: string }>;
    return Boolean(payload.success);
  },

  sendClericalReminder: async (
    taskId: string,
    payload: ManagerClericalReminderRequest,
  ): Promise<ApiResponse<ManagerClericalReminderResponse>> => {
    const response = await axiosClient.post(
      ENDPOINTS.MANAGER.REMIND_CLERICAL.replace(':taskId', encodeURIComponent(taskId)),
      {
        ...payload,
        targetRole: 'CLERICAL',
      },
    );

    return response.data as ApiResponse<ManagerClericalReminderResponse>;
  },
};
