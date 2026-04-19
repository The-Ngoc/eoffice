import axios from 'axios';
import { API_BE } from '../config/apiConfig';

const axiosClient = axios.create({
  baseURL: API_BE,
  headers: {
    'Content-Type': 'application/json',
  },
});


axiosClient.interceptors.request.use((config) => {
  return config;
});

export default axiosClient;