export const API_BE = 'http://localhost:3001';

export const ENDPOINTS = {
  USERS: {
    USER: '/api/user',
    ADD: '/api/user/add',
    UPDATE: '/api/user/update',
    DELETE: '/api/user/delete',
    ALL: '/api/user/all',
  },
  DOCUMENTS: {
    ALL: '/api/document/all',
    DOCUMENT: '/api/document',
    ADD: '/api/document/add',
    UPDATE_STATUS: '/api/document/update-status',
    SUBMIT_TO_LEADER: '/api/document/submit-to-leader',
    DELETE: '/api/document/delete',
  },
  LEADER: {
    WAITING_LEADER_DOCUMENTS: '/api/leader/documents/waiting-leader',
    APPROVE: '/api/leader/document/approve',
    REJECT: '/api/leader/document/reject',
    ASSIGN_DEPARTMENT: '/api/leader/document/assign-department',
    DEPARTMENTS: '/api/leader/departments',
    DEPARTMENT_MANAGER: '/api/leader/department/manager',
    STATS: '/api/leader/stats',
    DEPT_PERFORMANCE: '/api/leader/stats/dept-performance',
  },
  MANAGER: {
    ASSIGNED_TASKS: '/api/manager/tasks/assigned',
    SUB_TASKS: '/api/manager/tasks/sub',
    MEMBERS: '/api/manager/members',
    ASSIGN_TASK: '/api/manager/task/assign',
    UPDATE_TASK_STATUS: '/api/manager/task/status',
    STATS: '/api/manager/stats',
  }
};