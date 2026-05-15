/**
 * Centralized Enums for eOffice System
 * Ensures consistency across all modules
 */

// ============ ROLES ============
const ROLES = {
  ADMIN: 'ADMIN',
  LEADER: 'LEADER',
  MANAGER: 'MANAGER',
  CLERICAL: 'CLERICAL',
  SPECIALIST: 'SPECIALIST'
};

const ROLE_DISPLAY = {
  ADMIN: 'Quản trị viên',
  LEADER: 'Lãnh đạo',
  MANAGER: 'Trưởng phòng',
  CLERICAL: 'Văn thư',
  SPECIALIST: 'Chuyên viên'
};

// Role hierarchy for authorization
const ROLE_HIERARCHY = {
  ADMIN: 5,
  LEADER: 4,
  MANAGER: 3,
  CLERICAL: 2,
  SPECIALIST: 1
};

// ============ DOCUMENT STATUS ============
const DOCUMENT_STATUS = {
  DRAFT: 'DRAFT',                    // Nháp (chỉ vaên thư)
  PENDING_LEADER: 'PENDING_LEADER',  // Chờ lãnh đạo duyệt
  APPROVED: 'APPROVED',              // Đã duyệt, chờ giao việc
  ASSIGNED: 'ASSIGNED',              // Đã giao phòng ban
  PROCESSING: 'PROCESSING',          // Phòng ban đang xử lý
  COMPLETED: 'COMPLETED',            // Hoàn thành
  REJECTED: 'REJECTED'               // Từ chối
};

const DOCUMENT_STATUS_DISPLAY = {
  DRAFT: 'Nháp',
  PENDING_LEADER: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  ASSIGNED: 'Đã giao phòng',
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Từ chối'
};

// ============ DOCUMENT DIRECTION ============
const DOCUMENT_DIRECTION = {
  INBOUND: 'INBOUND',    // Văn bản đến
  OUTBOUND: 'OUTBOUND'   // Văn bản đi
};

// ============ DOCUMENT TYPE ============
const DOCUMENT_TYPE = {
  OFFICIAL: 'OFFICIAL',           // Công văn
  DECISION: 'DECISION',           // Quyết định
  RESOLUTION: 'RESOLUTION',       // Nghị quyết
  DISPATCH: 'DISPATCH',           // Chỉ thị
  CONTRACT: 'CONTRACT',           // Hợp đồng
  FORM: 'FORM',                   // Biểu mẫu
  REQUEST: 'REQUEST',             // Đơn yêu cầu
  REPORT: 'REPORT'                // Báo cáo
};

// ============ TASK STATUS ============
const TASK_STATUS = {
  TODO: 'TODO',                  // Chưa làm
  DOING: 'DOING',                // Đang làm
  WAITING_APPROVAL: 'WAITING_APPROVAL',  // Chờ duyệt
  DONE: 'DONE',                  // Xong
  OVERDUE: 'OVERDUE'             // Quá hạn (virtual)
};

const TASK_STATUS_DISPLAY = {
  TODO: 'Chưa làm',
  DOING: 'Đang làm',
  WAITING_APPROVAL: 'Chờ duyệt',
  DONE: 'Xong',
  OVERDUE: 'Quá hạn'
};

// ============ PRIORITY ============
const PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

const PRIORITY_DISPLAY = {
  LOW: 'Thường',
  MEDIUM: 'Khẩn',
  HIGH: 'Hỏa tốc',
  CRITICAL: 'Cực kỳ khẩn'
};

// Map from urgency to priority
const URGENCY_TO_PRIORITY = {
  'Thường': PRIORITY.LOW,
  'Khẩn': PRIORITY.HIGH,
  'Hỏa tốc': PRIORITY.CRITICAL
};

// ============ SIGNATURE STATUS ============
const SIGNATURE_STATUS = {
  PENDING: 'PENDING',
  SIGNED: 'SIGNED',
  REJECTED: 'REJECTED'
};

// ============ WORKFLOW ACTION ============
const WORKFLOW_ACTION = {
  CREATED: 'CREATED',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SIGNED: 'SIGNED',
  ASSIGNED: 'ASSIGNED',
  PROCESSING: 'PROCESSING',
  STAMPED: 'STAMPED',
  ISSUED: 'ISSUED',
  COMPLETED: 'COMPLETED'
};

// ============ SECURITY LEVEL ============
const SECURITY_LEVEL = {
  PUBLIC: 'PUBLIC',
  INTERNAL: 'INTERNAL',
  CONFIDENTIAL: 'CONFIDENTIAL',
  SECRET: 'SECRET'
};

const SECURITY_LEVEL_DISPLAY = {
  PUBLIC: 'Công khai',
  INTERNAL: 'Nội bộ',
  CONFIDENTIAL: 'Mật',
  SECRET: 'Tối mật'
};

// ============ VALIDATORS ============
function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

function isValidDocumentStatus(status) {
  return Object.values(DOCUMENT_STATUS).includes(status);
}

function isValidTaskStatus(status) {
  return Object.values(TASK_STATUS).includes(status);
}

function isValidPriority(priority) {
  return Object.values(PRIORITY).includes(priority);
}

module.exports = {
  // Roles
  ROLES,
  ROLE_DISPLAY,
  ROLE_HIERARCHY,
  isValidRole,

  // Document Status
  DOCUMENT_STATUS,
  DOCUMENT_STATUS_DISPLAY,
  isValidDocumentStatus,

  // Document Info
  DOCUMENT_DIRECTION,
  DOCUMENT_TYPE,
  URGENCY_TO_PRIORITY,

  // Task Status
  TASK_STATUS,
  TASK_STATUS_DISPLAY,
  isValidTaskStatus,

  // Priority
  PRIORITY,
  PRIORITY_DISPLAY,
  isValidPriority,

  // Signature
  SIGNATURE_STATUS,

  // Workflow
  WORKFLOW_ACTION,

  // Security
  SECURITY_LEVEL,
  SECURITY_LEVEL_DISPLAY
};
