import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { TaskModel, Meeting, ChatMessage } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

type BackendPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type BackendStatus = 'TODO' | 'DOING' | 'WAITING_APPROVAL' | 'REJECTED' | 'DONE' | 'OVERDUE';

interface BackendTaskDto {
  id: string;
  title: string;
  description?: string | null;
  status: BackendStatus;
  priority?: BackendPriority | null;
  dueDate?: string | null;
  createdAt: string;
  progress?: number;
  rejectionReason?: string | null;
  assigner?: { fullName?: string | null } | null;
  files?: Array<{ id: string; nameFile: string; url: string; createdAt?: string }>;
  history?: Array<{ id: string; type: string; progress?: number | null; content?: string | null; createdAt: string; user?: { id: string; fullName: string } | null }>;
}

const normalizePriority = (priority?: string | null): TaskModel['priority'] => {
  const normalized = (priority ?? '').toUpperCase();
  if (normalized === 'CRITICAL') return 'Critical';
  if (normalized === 'HIGH') return 'High';
  if (normalized === 'MEDIUM') return 'Medium';
  return 'Low';
};

const normalizeStatus = (status?: string | null): TaskModel['status'] => {
  const normalized = (status ?? '').toUpperCase();
  if (normalized === 'DOING') return 'Doing';
  if (normalized === 'WAITING_APPROVAL') return 'UnderReview';
  if (normalized === 'REJECTED') return 'Rejected';
  if (normalized === 'DONE') return 'Completed';
  if (normalized === 'OVERDUE') return 'Overdue';
  return 'Todo';
};

const mapBackendTask = (task: BackendTaskDto): TaskModel => ({
  id: String(task.id),
  title: task.title ?? 'Chưa có tiêu đề',
  description: task.description ?? undefined,
  sender: task.assigner?.fullName ?? 'N/A',
  status: normalizeStatus(task.status),
  priority: normalizePriority(task.priority),
  deadline: task.dueDate ?? '',
  createdAt: task.createdAt,
  progress: typeof task.progress === 'number' ? task.progress : undefined,
  rejectionReason: task.rejectionReason ?? null,
  files: task.files ?? [],
  history: task.history ?? [],
});

const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'MEET-01',
    title: 'Họp giao ban Phòng CNTT',
    startTime: '2024-04-27T08:30:00Z',
    endTime: '2024-04-27T10:00:00Z',
    platform: 'Teams',
    isOnline: true,
    joinUrl: 'https://teams.microsoft.com/l/meetup-join/...'
  },
  {
    id: 'MEET-02',
    title: 'Thảo luận kỹ thuật Dự án 2.0',
    startTime: '2024-04-27T14:00:00Z',
    endTime: '2024-04-27T15:30:00Z',
    platform: 'eOffice',
    isOnline: true,
    joinUrl: 'https://eoffice.gov.vn/meeting/...'
  }
];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'MSG-01',
    senderId: 'm-01',
    senderName: 'Manager',
    content: '@Bạn lưu ý sửa lại phần ngân sách trong bản dự thảo nhé.',
    timestamp: '2024-04-27T09:00:00Z',
    mentions: ['Bạn']
  }
];

export const specialistService = {
  getTasks: async (): Promise<TaskModel[]> => {
    const response = await axiosClient.get(ENDPOINTS.SPECIALIST.TASKS);
    const payload = response.data as ApiResponse<BackendTaskDto[]>;
    return (payload.data ?? []).map(mapBackendTask);
  },

  getTaskDetail: async (taskId: string): Promise<TaskModel> => {
    const response = await axiosClient.get(ENDPOINTS.SPECIALIST.TASK_DETAIL(taskId));
    const payload = response.data as ApiResponse<BackendTaskDto>;
    return mapBackendTask(payload.data);
  },

  updateTaskProgressWithLog: async (taskId: string, progress: number, content?: string): Promise<boolean> => {
    const response = await axiosClient.post(ENDPOINTS.SPECIALIST.UPDATE_PROGRESS(taskId), { progress, content });
    const payload = response.data as ApiResponse<unknown>;
    return payload.success;
  },

  addDailyLog: async (taskId: string, content: string): Promise<boolean> => {
    const response = await axiosClient.post(ENDPOINTS.SPECIALIST.ADD_COMMENT(taskId), { content });
    const payload = response.data as ApiResponse<unknown>;
    return payload.success;
  },

  submitTask: async (taskId: string, submissionNotes: string, files: File[]): Promise<boolean> => {
    const form = new FormData();
    form.append('submissionNotes', submissionNotes);
    files.forEach((file) => form.append('files', file));

    const response = await axiosClient.post(ENDPOINTS.SPECIALIST.SUBMIT(taskId), form);
    const payload = response.data as ApiResponse<unknown>;
    return payload.success;
  },

  resubmitTask: async (taskId: string, submissionNotes: string, files: File[]): Promise<boolean> => {
    const form = new FormData();
    form.append('submissionNotes', submissionNotes);
    files.forEach((file) => form.append('files', file));

    const response = await axiosClient.post(ENDPOINTS.SPECIALIST.RESUBMIT(taskId), form);
    const payload = response.data as ApiResponse<unknown>;
    return payload.success;
  },

  deleteTaskFile: async (taskId: string, fileId: string): Promise<boolean> => {
    const response = await axiosClient.delete(ENDPOINTS.SPECIALIST.DELETE_FILE(taskId, fileId));
    const payload = response.data as ApiResponse<unknown>;
    return payload.success;
  },

  getMeetings: async (): Promise<Meeting[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_MEETINGS), 300));
  },

  getMessages: async (): Promise<ChatMessage[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_MESSAGES), 250));
  },

  aiDecoder: async (content: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(`Giải mã từ AI: Dựa trên nội dung "${content.slice(0, 40)}"...`), 600);
    });
  },

  aiDraft: async (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(`BẢN DỰ THẢO: ${prompt}\n...`), 800);
    });
  },

  aiSearch: async (query: string): Promise<string[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([`Kết quả 1 cho: ${query}`, `Kết quả 2 cho: ${query}`]), 500);
    });
  },

  acceptTask: async (taskId: string): Promise<boolean> => {
    const response = await axiosClient.post(ENDPOINTS.SPECIALIST.UPDATE_PROGRESS(taskId), { progress: 1 });
    const payload = response.data as ApiResponse<unknown>;
    return payload.success;
  },

  completeTask: async (taskId: string): Promise<boolean> => {
    const response = await axiosClient.post(ENDPOINTS.SPECIALIST.UPDATE_PROGRESS(taskId), { progress: 100 });
    const payload = response.data as ApiResponse<unknown>;
    return payload.success;
  },
};
