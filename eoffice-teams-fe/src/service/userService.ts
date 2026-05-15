import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/apiConfig';
import { Role, User } from '../models/user';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface DeleteResult {
  id: string;
  deleted: boolean;
}

const unwrap = <T>(response: { data: ApiResponse<T> }): T => {
  return response.data.data;
};

export const getMyProfile = async (id: string): Promise<User> => {
  const response = await axiosClient.get(`${ENDPOINTS.USERS.USER}/${id}`);
  return unwrap<User>(response);
};

export const getAllUsers = async (): Promise<User[]> => {
  const response = await axiosClient.get(ENDPOINTS.USERS.ALL);
  return unwrap<User[]>(response);
};

export const addUser = async (userData: User): Promise<User> => {
  const response = await axiosClient.post(ENDPOINTS.USERS.ADD, userData);
  return unwrap<User>(response);
};

export const updateUserRole = async (id: string, role: Role): Promise<User> => {
  const response = await axiosClient.post(ENDPOINTS.USERS.UPDATE, { id, role });
  return unwrap<User>(response);
};

export const deleteUserById = async (id: string): Promise<DeleteResult> => {
  const response = await axiosClient.post(ENDPOINTS.USERS.DELETE, { id });
  return unwrap<DeleteResult>(response);
};
