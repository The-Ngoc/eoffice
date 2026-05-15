import axios from 'axios';
import { API_BE } from '../config/apiConfig';

const axiosClient = axios.create({
  baseURL: API_BE,
  headers: {
    'Content-Type': 'application/json',
  },
});


axiosClient.interceptors.request.use((config) => {
  const userId = localStorage.getItem('eo_user_id');
  const userRole = localStorage.getItem('eo_user_role');

  if (userId) {
    config.headers['x-user-id'] = userId;
  }

  if (userRole) {
    config.headers['x-user-role'] = userRole;
  }

  return config;
});

export default axiosClient;