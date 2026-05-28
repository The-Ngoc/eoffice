import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { TaskModel } from '../models/Task';
import { Document as DocumentModel } from '../models/Document';
import { Meeting, ChatMessage } from '../models/Communication';

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
  assigner?: { id?: string | null; fullName?: string | null; email?: string | null; role?: string | null } | null;
  files?: Array<{ id: string; nameFile: string; url: string; createdAt?: string }>;
  document?: {
    id: string;
    documentNumber?: string | null;
    symbol?: string | null;
    title?: string | null;
    sender?: string | null;
    type?: string | null;
    dueDate?: string | null;
    status?: string | null;
    priority?: string | null;
    createdAt?: string | null;
    summary?: string | null;
    legalWarning?: boolean | null;
    files?: Array<{ id: string | number; file_name: string; file_url: string }>;
  } | null;
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
  assigner: task.assigner?.id && task.assigner?.role
    ? {
        id: task.assigner.id,
        fullName: task.assigner.fullName ?? 'N/A',
        email: task.assigner.email ?? undefined,
        role: task.assigner.role as any,
      }
    : undefined,
  files: task.files ?? [],
  document: task.document
    ? {
        id: task.document.id,
        documentNumber: task.document.documentNumber ?? undefined,
        symbol: task.document.symbol ?? undefined,
        title: task.document.title ?? undefined,
        sender: task.document.sender ?? undefined,
        type: task.document.type ?? undefined,
        dueDate: task.document.dueDate ?? undefined,
        status: (task.document.status as DocumentModel['status']) ?? undefined,
        priority: (task.document.priority as DocumentModel['priority']) ?? undefined,
        createdAt: task.document.createdAt ?? undefined,
        summary: task.document.summary ?? undefined,
        legalWarning: task.document.legalWarning ?? undefined,
        files: task.document.files?.map((file) => ({
          id: String(file.id),
          file_name: file.file_name,
          file_url: file.file_url,
        })),
      }
    : undefined,
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
    const response = await axiosClient.get(
      ENDPOINTS.SPECIALIST.TASK_DETAIL.replace(':taskId', encodeURIComponent(taskId)),
    );
    const payload = response.data as ApiResponse<BackendTaskDto>;
    return mapBackendTask(payload.data);
  },

  updateTaskProgressWithLog: async (taskId: string, progress: number, content?: string): Promise<boolean> => {
    const response = await axiosClient.post(
      ENDPOINTS.SPECIALIST.UPDATE_PROGRESS.replace(':taskId', encodeURIComponent(taskId)),
      { progress, content },
    );
    console.log('📈 Progress update response:', { taskId, progress, content, responseData: response.data });
    const payload = response.data as ApiResponse<unknown>;
    return payload.success;
  },

  addDailyLog: async (taskId: string, content: string): Promise<boolean> => {
    const response = await axiosClient.post(
      ENDPOINTS.SPECIALIST.ADD_COMMENT.replace(':taskId', encodeURIComponent(taskId)),
      { content },
    );
    const payload = response.data as ApiResponse<unknown>;
    return payload.success;
  },

  submitTask: async (taskId: string, submissionNotes: string, files: File[]): Promise<boolean> => {
    const url = ENDPOINTS.SPECIALIST.SUBMIT.replace(':taskId', encodeURIComponent(taskId));
    const form = new FormData();
    form.append('submissionNotes', submissionNotes);
    files.forEach((file) => form.append('files', file));

    try {
      const response = await axiosClient.post(url, form);
      const payload = response.data as ApiResponse<unknown>;
      console.log('submitTask response', { url, payload });
      return payload.success;
    } catch (err: any) {
      console.error('submitTask failed', { url, taskId, submissionNotesLength: submissionNotes?.length, filesCount: files.length, error: err?.response?.data || err?.message || err });

      try {
        const altForm = new FormData();
        altForm.append('notes', submissionNotes);
        files.forEach((file) => altForm.append('files', file));
        const altResponse = await axiosClient.post(url, altForm);
        const altPayload = altResponse.data as ApiResponse<unknown>;

        return altPayload.success;
      } catch (altErr: any) {
        console.error('submitTask fallback failed', { url, taskId, error: altErr?.response?.data || altErr?.message || altErr });
        return false;
      }
    }
  },

  resubmitTask: async (taskId: string, submissionNotes: string, files: File[]): Promise<boolean> => {
    const url = ENDPOINTS.SPECIALIST.RESUBMIT.replace(':taskId', encodeURIComponent(taskId));
    const form = new FormData();
    form.append('submissionNotes', submissionNotes);
    files.forEach((file) => form.append('files', file));

    try {
      const response = await axiosClient.post(url, form);
      const payload = response.data as ApiResponse<unknown>;
      return payload.success;
    } catch (err: any) {
      console.error('resubmitTask failed', { url, taskId, submissionNotesLength: submissionNotes?.length, filesCount: files.length, error: err?.response?.data || err?.message || err });
  
      try {
        const altForm = new FormData();
        altForm.append('notes', submissionNotes);
        files.forEach((file) => altForm.append('files', file));
        const altResponse = await axiosClient.post(url, altForm);
        const altPayload = altResponse.data as ApiResponse<unknown>;
        return altPayload.success;
      } catch (altErr: any) {
        console.error('resubmitTask fallback failed', { url, taskId, error: altErr?.response?.data || altErr?.message || altErr });
        return false;
      }
    }
  },

  deleteTaskFile: async (taskId: string, fileId: string): Promise<boolean> => {
    const response = await axiosClient.delete(
      ENDPOINTS.SPECIALIST.DELETE_FILE
        .replace(':taskId', encodeURIComponent(taskId))
        .replace(':fileId', encodeURIComponent(fileId)),
    );
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
    const response = await axiosClient.post(
      ENDPOINTS.SPECIALIST.UPDATE_PROGRESS.replace(':taskId', encodeURIComponent(taskId)),
      { progress: 1 },
    );
    const payload = response.data as ApiResponse<unknown>;
    return payload.success;
  },

  completeTask: async (taskId: string): Promise<boolean> => {
    const response = await axiosClient.post(
      ENDPOINTS.SPECIALIST.UPDATE_PROGRESS.replace(':taskId', encodeURIComponent(taskId)),
      { progress: 100 },
    );
    const payload = response.data as ApiResponse<unknown>;
    return payload.success;
  },
};
