const LOCAL_API_BE = 'http://localhost:3001';
const REMOTE_API_BE = 'https://eoffice-0qsj.onrender.com';

const resolveDefaultApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return REMOTE_API_BE;
  }

  const { hostname } = window.location;
  const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);

  return isLocalHost ? LOCAL_API_BE : REMOTE_API_BE;
};

export const API_BE = (import.meta.env.VITE_API_BE || resolveDefaultApiBaseUrl()).trim();

export const API_HOST = API_BE;


export const ENDPOINTS = {
  RAG: {
    CHAT: '/api/chat',
  },
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
    UPDATE_STATUS: '/api/document/status-approve',
    SUBMIT_TO_LEADER: '/api/document/submit-to-leader',
    SEAL: '/api/document/:id/seal',
    DELETE: '/api/document/delete',
    FILES: '/api/document/files',
    FLOW_HISTORY: '/api/documents/:documentId/flow-history',
    EXTRACT_CONTENT: '/api/document/extract-azure-content',
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
    DEPARTMENT_TASKS: '/api/manager/tasks/my',
    MEMBERS: '/api/departments/:departmentId/members',
    TASKS: '/api/tasks',
    TASK_DETAIL: '/api/tasks/:taskId',
    CREATE_TASK: '/api/new-task',


    SUB_TASKS: '/api/manager/tasks/sub',
    MEMBER_DETAIL: '/api/members',
    TASKS_BY_MEMBER: '/api/tasks/member',
    ASSIGN_TASK: '/api/tasks',
    REMIND_CLERICAL: '/api/manager/tasks/:taskId/remind-clerical',
    UPDATE_TASK_STATUS: '/api/tasks',
    STATS: '/api/manager/stats',
  },
  SPECIALIST: {
    TASKS: '/api/specialist/tasks',
    TASK_DETAIL: '/api/specialist/tasks/:taskId',
    UPDATE_PROGRESS: '/api/specialist/tasks/:taskId/progress',
    ADD_COMMENT: '/api/specialist/tasks/:taskId/comment', 
    SUBMIT: '/api/specialist/tasks/:taskId/submit',
    RESUBMIT: '/api/specialist/tasks/:taskId/resubmit',
    DELETE_FILE: '/api/specialist/tasks/:taskId/files/:fileId',
  }
};
