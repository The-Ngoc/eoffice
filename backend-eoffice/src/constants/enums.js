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
  ADMIN: 'Quáº£n trá»‹ viÃªn',
  LEADER: 'LÃ£nh Ä‘áº¡o',
  MANAGER: 'TrÆ°á»Ÿng phÃ²ng',
  CLERICAL: 'VÄƒn thÆ°',
  SPECIALIST: 'ChuyÃªn viÃªn'
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
  DRAFT: 'DRAFT',                    // NhÃ¡p (chá»‰ vaÃªn thÆ°)
  PENDING_LEADER: 'PENDING_LEADER',  // Chá» lÃ£nh Ä‘áº¡o duyá»‡t
  APPROVED: 'APPROVED',              // ÄÃ£ duyá»‡t, chá» giao viá»‡c
  ASSIGNED: 'ASSIGNED',              // ÄÃ£ giao phÃ²ng ban
  PROCESSING: 'PROCESSING',          // PhÃ²ng ban Ä‘ang xá»­ lÃ½
  COMPLETED: 'COMPLETED',            // HoÃ n thÃ nh
  REJECTED: 'REJECTED'               // Tá»« chá»‘i
};

const DOCUMENT_STATUS_DISPLAY = {
  DRAFT: 'NhÃ¡p',
  PENDING_LEADER: 'Chá» duyá»‡t',
  APPROVED: 'ÄÃ£ duyá»‡t',
  ASSIGNED: 'ÄÃ£ giao phÃ²ng',
  PROCESSING: 'Äang xá»­ lÃ½',
  COMPLETED: 'HoÃ n thÃ nh',
  REJECTED: 'Tá»« chá»‘i'
};

// ============ DOCUMENT DIRECTION ============
const DOCUMENT_DIRECTION = {
  INBOUND: 'INBOUND',    // VÄƒn báº£n Ä‘áº¿n
  OUTBOUND: 'OUTBOUND'   // VÄƒn báº£n Ä‘i
};

// ============ DOCUMENT TYPE ============
const DOCUMENT_TYPE = {
  OFFICIAL: 'OFFICIAL',           // CÃ´ng vÄƒn
  DECISION: 'DECISION',           // Quyáº¿t Ä‘á»‹nh
  RESOLUTION: 'RESOLUTION',       // Nghá»‹ quyáº¿t
  DISPATCH: 'DISPATCH',           // Chá»‰ thá»‹
  CONTRACT: 'CONTRACT',           // Há»£p Ä‘á»“ng
  FORM: 'FORM',                   // Biá»ƒu máº«u
  REQUEST: 'REQUEST',             // ÄÆ¡n yÃªu cáº§u
  REPORT: 'REPORT'                // BÃ¡o cÃ¡o
};

// ============ TASK STATUS ============
const TASK_STATUS = {
  TODO: 'TODO',                  // ChÆ°a lÃ m
  DOING: 'DOING',                // Äang lÃ m
  WAITING_APPROVAL: 'WAITING_APPROVAL',  // Chá» duyá»‡t
  REJECTED: 'REJECTED',          // Tu choi (manager reject)
  DONE: 'DONE',                  // Xong
  OVERDUE: 'OVERDUE'             // QuÃ¡ háº¡n (virtual)
};

const TASK_STATUS_DISPLAY = {
  TODO: 'ChÆ°a lÃ m',
  DOING: 'Äang lÃ m',
  WAITING_APPROVAL: 'Chá» duyá»‡t',
  REJECTED: 'Tu choi',
  DONE: 'Xong',
  OVERDUE: 'QuÃ¡ háº¡n'
};

// ============ PRIORITY ============
const PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

const PRIORITY_DISPLAY = {
  LOW: 'ThÆ°á»ng',
  MEDIUM: 'Kháº©n',
  HIGH: 'Há»a tá»‘c',
  CRITICAL: 'Cá»±c ká»³ kháº©n'
};

// Map from urgency to priority
const URGENCY_TO_PRIORITY = {
  'ThÆ°á»ng': PRIORITY.LOW,
  'Kháº©n': PRIORITY.HIGH,
  'Há»a tá»‘c': PRIORITY.CRITICAL
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
  PUBLIC: 'CÃ´ng khai',
  INTERNAL: 'Ná»™i bá»™',
  CONFIDENTIAL: 'Máº­t',
  SECRET: 'Tá»‘i máº­t'
};

// ============ FILE UPLOAD STATUS ============
const FILE_UPLOAD_STATUS = {
  PENDING: 'PENDING',           // Chá» upload (file chÆ°a Ä‘Æ°á»£c gá»­i lÃªn Cloudinary)
  UPLOADING: 'UPLOADING',       // Äang upload (file Ä‘ang Ä‘Æ°á»£c gá»­i)
  UPLOADED: 'UPLOADED',         // ÄÃ£ upload (file táº£i lÃªn Cloudinary thÃ nh cÃ´ng)
  FAILED: 'FAILED'              // Tháº¥t báº¡i (upload tháº¥t báº¡i, cáº§n retry)
};

const FILE_UPLOAD_STATUS_DISPLAY = {
  PENDING: 'Chá» upload',
  UPLOADING: 'Äang upload',
  UPLOADED: 'ÄÃ£ upload',
  FAILED: 'Tháº¥t báº¡i'
};

// ============ SUPPORTED FILE TYPES ============
const SUPPORTED_FILE_TYPES = {
  PDF: 'application/pdf',           // TÃ i liá»‡u PDF
  PNG: 'image/png',                 // HÃ¬nh áº£nh PNG
  JPG: 'image/jpeg',                // HÃ¬nh áº£nh JPEG
  JPEG: 'image/jpeg',               // HÃ¬nh áº£nh JPEG (alias)
  DOC: 'application/msword',        // TÃ i liá»‡u Word
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // TÃ i liá»‡u Word má»›i
  XLS: 'application/vnd.ms-excel',  // Báº£ng tÃ­nh Excel
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // Báº£ng tÃ­nh Excel má»›i
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
  SECURITY_LEVEL_DISPLAY,

  // File Upload
  FILE_UPLOAD_STATUS,
  FILE_UPLOAD_STATUS_DISPLAY,
  SUPPORTED_FILE_TYPES
};
