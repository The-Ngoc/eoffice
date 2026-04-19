import axiosClient from '../api/axiosClient' ;
import { ENDPOINTS } from '../config/apiConfig';

export const getMyProfile = async (id: string) => {
  const response = await axiosClient.get(`${ENDPOINTS.USERS.USER}/${id}`);
  return response.data;
};

// export const getAllUsers = async () => {
//   const response = await axiosClient.get(ENDPOINTS.USERS.ALL);
//   return response.data;
// }

export const addUser = async (userData: {id?: string; fullName: string; email: string; role: string }) => {
  const response = await axiosClient.post(ENDPOINTS.USERS.ADD, userData);
  return response.data;
}

