import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { Department, DocumentTask, KPIStats, LeaderDeptPerformance } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface LeaderDocumentDto {
  id: string | number;
  title?: string;
  sender?: string;
  date?: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  type?: string;
  priority?: string;
  summary?: string;
  content?: string;
  legalWarnings?: string[];
}

const normalizeStatus = (status?: string): DocumentTask['status'] => {
  const normalized = (status ?? '').toUpperCase();

  if (normalized === 'PROCESSING') {
    return 'Processing';
  }
  if (normalized === 'COMPLETED') {
    return 'Completed';
  }
  if (normalized === 'REJECTED') {
    return 'Rejected';
  }
  if (normalized === 'URGENT') {
    return 'Urgent';
  }

  return 'Pending';
};

const normalizePriority = (priority?: string): DocumentTask['priority'] => {
  const normalized = (priority ?? '').toUpperCase();

  if (normalized === 'CRITICAL') {
    return 'Critical';
  }
  if (normalized === 'HIGH') {
    return 'High';
  }
  if (normalized === 'MEDIUM') {
    return 'Medium';
  }

  return 'Low';
};

const mapDocumentDto = (item: LeaderDocumentDto): DocumentTask => {
  const timeReference = item.startTime ?? item.date ?? new Date().toISOString();

  return {
    id: String(item.id),
    title: item.title ?? 'Chưa có tiêu đề',
    sender: item.sender ?? 'N/A',
    date: timeReference,
    description: item.description,
    location: item.location,
    startTime: item.startTime,
    endTime: item.endTime,
    status: normalizeStatus(item.status),
    type: item.type ?? 'Khác',
    priority: normalizePriority(item.priority),
    summary: item.summary,
    content: item.content,
    legalWarnings: item.legalWarnings ?? [],
  };
};

export const leaderService = {
  // Lấy danh sách văn bản đang chờ Leader duyệt.
  getPendingDocuments: async (): Promise<DocumentTask[]> => {
    const response = await axiosClient.get(ENDPOINTS.LEADER.WAITING_LEADER_DOCUMENTS);
    const payload = response.data as ApiResponse<LeaderDocumentDto[]>;
    return (payload.data ?? []).map(mapDocumentDto);
  },

  // Phê duyệt văn bản theo id.
  approveDocument: async (id: string): Promise<boolean> => {
    const response = await axiosClient.post(ENDPOINTS.LEADER.APPROVE, { id });
    const payload = response.data as ApiResponse<null>;
    return payload.success;
  },

  // Từ chối văn bản với lý do cụ thể.
  rejectDocument: async (id: string, reason: string): Promise<boolean> => {
    const response = await axiosClient.post(ENDPOINTS.LEADER.REJECT, { id, reason });
    const payload = response.data as ApiResponse<null>;
    return payload.success;
  },

  // Chỉ định văn bản cho phòng ban xử lý từ Leader.
  assignDepartmentToProcess: async (
    docId: string,
    deptId: string,
    directionDescription?: string,
    managerId?: string,
  ): Promise<boolean> => {
    const response = await axiosClient.post(ENDPOINTS.LEADER.ASSIGN_DEPARTMENT, {
      docId,
      deptId,
      directionDescription,
      managerId,
    });
    const payload = response.data as ApiResponse<null>;
    return payload.success;
  },

  // Lấy danh sách văn bản đã duyệt.
  getApprovedDocuments: async (): Promise<DocumentTask[]> => {
    const response = await axiosClient.get(ENDPOINTS.LEADER.APPROVED_DOCUMENTS);
    const payload = response.data as ApiResponse<DocumentTask[]>;
    return (payload.data ?? []).map(mapDocumentDto);
  },

  // Lấy danh sách phòng ban để hiển thị dropdown.
  getDepartments: async (): Promise<Department[]> => {
    const response = await axiosClient.get(ENDPOINTS.LEADER.DEPARTMENTS);
    const payload = response.data as ApiResponse<Department[]>;
    return payload.data ?? [];
  },

  // Lấy thông tin trưởng phòng theo department id.
  getDeptManager: async (deptId: string): Promise<Department | null> => {
    const response = await axiosClient.get(`${ENDPOINTS.LEADER.DEPARTMENT_MANAGER}/${deptId}`);
    const payload = response.data as ApiResponse<Department>;
    return payload.data ?? null;
  },

  // Lấy dữ liệu thống kê cho card KPI của Leader.
  getLeaderStats: async (): Promise<KPIStats> => {
    const response = await axiosClient.get(ENDPOINTS.LEADER.STATS);
    const payload = response.data as ApiResponse<KPIStats>;

    return (
      payload.data ?? {
        totalDocs: 0,
        pendingApprovals: 0,
        processingTime: '0 ngày',
        efficiency: 0,
      }
    );
  },

  // Lấy dữ liệu biểu đồ hiệu suất theo phòng ban.
  getDeptPerformance: async (): Promise<LeaderDeptPerformance[]> => {
    const response = await axiosClient.get(ENDPOINTS.LEADER.DEPT_PERFORMANCE);
    const payload = response.data as ApiResponse<LeaderDeptPerformance[]>;
    return payload.data ?? [];
  },
};
