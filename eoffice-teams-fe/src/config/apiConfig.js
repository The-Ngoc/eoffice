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
    FILES: '/api/document/files',
    FLOW_HISTORY: '/api/document/flow-history',
  },
  LEADER: {
    WAITING_LEADER_DOCUMENTS: '/api/leader/documents/waiting-leader',
    APPROVED_DOCUMENTS: '/api/leader/documents/approved',
    APPROVE: '/api/leader/document/approve',
    REJECT: '/api/leader/document/reject',
    ASSIGN_DEPARTMENT: '/api/leader/document/assign-department',
    DEPARTMENTS: '/api/leader/departments',
    DEPARTMENT_MANAGER: '/api/leader/department/manager',
    STATS: '/api/leader/stats',
    DEPT_PERFORMANCE: '/api/leader/stats/dept-performance',
  },
  MANAGER: {
    MY_TASKS: '/api/manager/tasks/my',
    SUB_TASKS: '/api/manager/tasks/sub',
    MEMBERS: '/api/manager/members',
    ASSIGN_TASK: '/api/manager/task/assign',
    UPDATE_TASK_STATUS: '/api/manager/task/status',
    STATS: '/api/manager/stats',
  },
  SPECIALIST: {
    TASKS: '/api/specialist/tasks',
    TASK_DETAIL: (taskId) => `/api/specialist/tasks/${taskId}`,
    UPDATE_PROGRESS: (taskId) => `/api/specialist/tasks/${taskId}/progress`,
    ADD_COMMENT: (taskId) => `/api/specialist/tasks/${taskId}/comment`,
    SUBMIT: (taskId) => `/api/specialist/tasks/${taskId}/submit`,
    RESUBMIT: (taskId) => `/api/specialist/tasks/${taskId}/resubmit`,
    DELETE_FILE: (taskId, fileId) => `/api/specialist/tasks/${taskId}/files/${fileId}`,
  }
};
