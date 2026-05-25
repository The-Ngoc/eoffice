import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { DepartmentMember } from '../models/Department';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  rows: T[];
  count: number;
  totalPages: number;
  page: number;
  limit: number;
}

const normalizeResponseList = <T>(responseData: ApiResponse<T[] | PaginatedResponse<T>>): T[] => {
  if (Array.isArray(responseData.data)) {
    return responseData.data;
  }

  return responseData.data?.rows ?? [];
};

export const departmentMemberService = {
  getMembersByDepartmentId: async (departmentId: string): Promise<DepartmentMember[]> => {
    const response = await axiosClient.get(ENDPOINTS.MANAGER.MEMBERS.replace(':departmentId', encodeURIComponent(departmentId)));
    const payload = response.data as ApiResponse<DepartmentMember[] | PaginatedResponse<DepartmentMember>>;
    const members = normalizeResponseList(payload);

    return members;
  },
    getMemberDetail: async (memberId: string): Promise<DepartmentMember | null> => {
    const response = await axiosClient.get(`${ENDPOINTS.MANAGER.MEMBER_DETAIL}/${encodeURIComponent(memberId)}`);
    const payload = response.data as ApiResponse<DepartmentMember>;
    return payload.data ?? null;
  },
};