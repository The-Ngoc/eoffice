// Lấy URL từ file .env, nếu không có thì mặc định là localhost:3001
export const API_BE = 'http://localhost:3001';

export const ENDPOINTS = {
  USERS: {
    USER: '/api/user',
    ADD: '/api/user/add',
    UPDATE: '/api/user/update',
    DELETE: '/api/user/delete',
    ALL: '/api/user/all',
  }
};