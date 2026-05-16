
export type ClericalDocumentStatus =
  | 'INITIALIZED'
  | 'WAITING_LEADER'
  | 'PROCESSING'
  | 'REJECTED'
  | 'WAITING_PUBLISH'
  | 'PUBLISHED';
export type ClericalFlowStepStatus = 'Done' | 'Current' | 'Next';
export type ClericalUrgency = 'Thường' | 'Khẩn' | 'Hỏa tốc';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// DTO from backend JSON payload.
export interface ClericalFlowStepDto {
  id?: string | number;
  user?: string;
  action?: string;
  time?: string;
  status?: string;
}

// DTO from backend JSON payload.
export interface ClericalDocumentDto {
  id: string | number;
  docNumber?: string;
  symbol?: string;
  title?: string;
  sender?: string;
  status?: string;
  urgency?: string;
  arrivalDate?: string;
  type?: string;
  isOverdue?: boolean;
  flow?: ClericalFlowStepDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ClericalDocument {
  id: string;
  docNumber: string;
  symbol: string;
  title: string;
  sender: string;
  status: ClericalDocumentStatus;
  urgency: ClericalUrgency;
  arrivalDate: Date;
  type: string;
  isOverdue: boolean;
  flow: ClericalFlowStep[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClericalFlowStep {
  id: string;
  user: string;
  action: string;
  time: string;
  status: ClericalFlowStepStatus;
}

export interface CreateDocumentPayload {
  docNumber: string;
  symbol: string;
  title: string;
  sender: string;
  status?: ClericalDocumentStatus;
  urgency: ClericalUrgency;
  arrivalDate: string;
  type: string;
  isOverdue?: boolean;
}

const normalizeStatus = (status?: string): ClericalDocumentStatus => {
  if (!status) {
    return 'INITIALIZED';
  }

  const normalized = status.toUpperCase();
  if (normalized === 'INITIALIZED' || normalized === 'KHOI_TAO' || normalized === 'DRAFT') {
    return 'INITIALIZED';
  }
  if (
    normalized === 'WAITING_LEADER'
    || normalized === 'PENDING_LEADER'
    || normalized === 'PENDING'
    || normalized === 'URGENT'
  ) {
    return 'WAITING_LEADER';
  }
  // Backend previously returned "COMPLETED" for documents that are ready
  // to be published. Map that to the new UI status 'WAITING_PUBLISH'.
  if (normalized === 'COMPLETED' || normalized === 'WAITING_PUBLISH') {
    return 'WAITING_PUBLISH';
  }

  if (normalized === 'PUBLISHED') {
    return 'PUBLISHED';
  }

  if (normalized === 'PROCESSING') {
    return 'PROCESSING';
  }

  if (normalized === 'REJECTED') {
    return 'REJECTED';
  }

  return 'INITIALIZED';
};

const normalizeUrgency = (urgency?: string): ClericalUrgency => {
  if (!urgency) {
    return 'Thường';
  }

  const normalized = urgency.toUpperCase();
  if (normalized === 'HOA_TOC' || normalized === 'HOATOC' || normalized === 'EXPRESS') {
    return 'Hỏa tốc';
  }
  if (normalized === 'KHAN' || normalized === 'URGENT') {
    return 'Khẩn';
  }

  return 'Thường';
};

const normalizeFlowStatus = (status?: string): ClericalFlowStepStatus => {
  if (!status) {
    return 'Next';
  }

  const normalized = status.toUpperCase();
  if (normalized === 'DONE') {
    return 'Done';
  }
  if (normalized === 'CURRENT') {
    return 'Current';
  }

  return 'Next';
};

const toDate = (value?: string): Date => {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
};

export const mapFlowStepDto = (flowStep: ClericalFlowStepDto, index: number): ClericalFlowStep => {
  return {
    id: String(flowStep.id ?? `flow-${index}`),
    user: flowStep.user ?? 'N/A',
    action: flowStep.action ?? 'Đang cập nhật',
    time: flowStep.time ?? '--',
    status: normalizeFlowStatus(flowStep.status),
  };
};

export const mapClericalDocumentDto = (document: ClericalDocumentDto): ClericalDocument => {
  return {
    id: String(document.id),
    docNumber: document.docNumber ?? '',
    symbol: document.symbol ?? '',
    title: document.title ?? 'Chưa có tiêu đề',
    sender: document.sender ?? 'Chưa rõ đơn vị gửi',
    status: normalizeStatus(document.status),
    urgency: normalizeUrgency(document.urgency),
    arrivalDate: toDate(document.arrivalDate),
    type: document.type ?? 'Khác',
    isOverdue: Boolean(document.isOverdue),
    flow: (document.flow ?? []).map((item, index) => mapFlowStepDto(item, index)),
    createdAt: document.createdAt ? toDate(document.createdAt) : undefined,
    updatedAt: document.updatedAt ? toDate(document.updatedAt) : undefined,
  };
};
