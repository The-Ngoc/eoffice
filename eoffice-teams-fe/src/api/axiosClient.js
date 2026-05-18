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

  // 🔧 Fix: Xóa Content-Type nếu gửi FormData để cho browser tự set multipart/form-data
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

export default axiosClient;