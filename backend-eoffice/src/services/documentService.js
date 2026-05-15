const { randomUUID } = require('crypto');
const documentRepository = require('../repository/documentRepository');
const { DOCUMENT_STATUS } = require('../constants/enums');

// Map old status names to new enum for backward compatibility
const LEGACY_STATUS_MAP = {
    initialized: DOCUMENT_STATUS.DRAFT,
    draft: DOCUMENT_STATUS.DRAFT,
    pending: DOCUMENT_STATUS.PENDING_LEADER,
    waiting_leader: DOCUMENT_STATUS.PENDING_LEADER,
    pending_leader: DOCUMENT_STATUS.PENDING_LEADER,
    wailting_leader: DOCUMENT_STATUS.PENDING_LEADER,
    processing: DOCUMENT_STATUS.PROCESSING,
    completed: DOCUMENT_STATUS.COMPLETED,
    rejected: DOCUMENT_STATUS.REJECTED,
    urgent: DOCUMENT_STATUS.PENDING_LEADER
};

function normalizeStatus(value, fallback = DOCUMENT_STATUS.DRAFT) {
    if (!value) return fallback;
    const key = String(value || '').trim().toLowerCase();
    return LEGACY_STATUS_MAP[key] || fallback;
}

function createNotFoundError(message) {
    const error = new Error(message);
    error.statusCode = 404;
    return error;
}

function createValidationError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function isValidDate(value) {
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
}

function normalizeDateValue(value) {
    if (!value) return value;
    if (typeof value === 'string') {
        return value.split('T')[0];
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString().split('T')[0];
}

function normalizeJsonArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [value];
        } catch (error) {
            return [value];
        }
    }

    return [];
}

function normalizeStatusKey(value) {
    return String(value || '').trim().toLowerCase();
}

function calculateIsOverdue(arrivalDate, status) {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    if (!arrivalDate || normalizedStatus === 'completed') {
        return false;
    }
    const arrivedAt = new Date(arrivalDate);
    const today = new Date();
    arrivedAt.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return arrivedAt < today;
}

function buildDocumentResponse(doc) {
    if (!doc) return null;
    const plain = doc.get ? doc.get({ plain: true }) : doc;
    return {
        id: plain.id,
        docNumber: plain.docNumber,
        symbol: plain.symbol,
        title: plain.title,
        sender: plain.sender,
        status: plain.status,
        urgency: plain.urgency,
        arrivalDate: plain.arrivalDate ? String(plain.arrivalDate) : null,
        type: plain.type,
        isOverdue: Boolean(plain.isOverdue),
        flow: Array.isArray(plain.flow) ? plain.flow : [],
        summary: plain.summary || null,
        content: plain.content || null,
        legalWarnings: normalizeJsonArray(plain.legalWarnings || plain.legal_warnings),
        attachments: normalizeJsonArray(plain.attachments),
        rejectReason: plain.rejectReason || plain.reject_reason || null,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt
    };
}

async function getAllDocuments() {
    const documents = await documentRepository.findAllDocuments();
    return documents.map(buildDocumentResponse);
}

async function getDocumentById(id) {
    const document = await documentRepository.findDocumentById(id);
    if (!document) {
        throw createNotFoundError('Văn bản không tồn tại');
    }
    return buildDocumentResponse(document);
}

async function createDocument(payload) {
    const errors = [];

    const requiredFields = ['docNumber', 'symbol', 'title', 'sender', 'urgency', 'arrivalDate', 'type'];
    requiredFields.forEach(field => {
        if (!payload[field]) {
            errors.push(`${field} là bắt buộc`);
        }
    });

    const normalizedStatus = normalizeStatus(payload.status, DOCUMENT_STATUS.DRAFT);
    if (!Object.values(DOCUMENT_STATUS).includes(normalizedStatus)) {
        errors.push('status không hợp lệ');
    }

    if (payload.urgency && !['Thường', 'Khẩn', 'Hỏa tốc'].includes(payload.urgency)) {
        errors.push('urgency không hợp lệ');
    }

    if (payload.arrivalDate && !isValidDate(payload.arrivalDate)) {
        errors.push('arrivalDate không hợp lệ');
    }

    if (errors.length > 0) {
        throw createValidationError(errors.join(', '));
    }

    const normalizedPayload = {
        id: payload.id || randomUUID(),
        docNumber: payload.docNumber.trim(),
        symbol: payload.symbol.trim(),
        title: payload.title.trim(),
        sender: payload.sender.trim(),
        status: normalizedStatus,
        urgency: payload.urgency,
        arrivalDate: normalizeDateValue(payload.arrivalDate),
        type: payload.type.trim(),
        summary: payload.summary || null,
        content: payload.content || null,
        legalWarnings: JSON.stringify(normalizeJsonArray(payload.legalWarnings)),
        attachments: JSON.stringify(normalizeJsonArray(payload.attachments)),
        isOverdue: calculateIsOverdue(payload.arrivalDate, normalizedStatus),
        flow: Array.isArray(payload.flow) && payload.flow.length > 0
            ? payload.flow
            : [{
                id: `flow-${Date.now()}`,
                user: payload.sender.trim(),
                action: 'CREATED',
                time: new Date().toISOString(),
                status: 'Done'
            }]
    };

    const created = await documentRepository.createDocument(normalizedPayload);
    return buildDocumentResponse(created);
}

async function updateDocumentStatus(payload) {
    if (!payload.id || !payload.status) {
        throw createValidationError('id và status là bắt buộc');
    }

    const nextStatus = normalizeStatus(payload.status);
    if (!Object.values(DOCUMENT_STATUS).includes(nextStatus)) {
        throw createValidationError('status không hợp lệ');
    }

    const existing = await documentRepository.findDocumentById(payload.id);
    if (!existing) {
        throw createNotFoundError('Văn bản không tồn tại');
    }

    const updated = await documentRepository.updateDocumentById(payload.id, {
        status: nextStatus,
        isOverdue: calculateIsOverdue(existing.arrivalDate, nextStatus)
    });

    const flowStep = {
        id: `flow-${Date.now()}`,
        user: payload.userName || payload.userId || 'Clerical',
        action: 'STATUS_UPDATED',
        time: new Date().toISOString(),
        status: 'Current'
    };

    await documentRepository.appendFlowStep(payload.id, flowStep);
    await documentRepository.createFlowHistory({
        documentId: payload.id,
        action: 'STATUS_UPDATED',
        status: nextStatus,
        note: payload.note || null,
        processedAt: new Date(),
        managerId: null,
        departmentId: null
    });

    return buildDocumentResponse(updated);
}

async function submitDocumentToLeader(payload, actor = {}) {
    const id = payload?.id;
    if (!id) {
        throw createValidationError('id là bắt buộc');
    }

    const document = await documentRepository.findDocumentById(id);
    if (!document) {
        throw createNotFoundError('Văn bản không tồn tại');
    }

    const currentStatus = document.status;
    const submitAllowed = new Set([DOCUMENT_STATUS.DRAFT, DOCUMENT_STATUS.REJECTED]);

    if (document.assignedDepartmentId) {
        throw createValidationError('Văn bản đã được chuyển phòng ban, không thể trình lại lãnh đạo');
    }

    if (!submitAllowed.has(currentStatus)) {
        if (currentStatus === DOCUMENT_STATUS.PENDING_LEADER) {
            throw createValidationError('Văn bản đã được trình lãnh đạo');
        }

        throw createValidationError('Chỉ văn bản ở trạng thái khởi tạo hoặc bị từ chối mới được trình lãnh đạo');
    }

    const nextStatus = DOCUMENT_STATUS.PENDING_LEADER;
    const flowStep = {
        id: `flow-${Date.now()}`,
        user: actor.name || actor.id || 'Clerical',
        action: 'SUBMIT_TO_LEADER',
        time: new Date().toISOString(),
        status: 'Current'
    };

    await documentRepository.updateDocumentById(id, {
        status: nextStatus,
        isOverdue: calculateIsOverdue(document.arrivalDate, nextStatus)
    });
    await documentRepository.appendFlowStep(id, flowStep);
    await documentRepository.createFlowHistory({
        documentId: id,
        action: 'SUBMIT_TO_LEADER',
        status: nextStatus,
        note: payload.note || null,
        processedAt: new Date(),
        managerId: null,
        departmentId: null
    });

    const updated = await documentRepository.findDocumentById(id);
    return buildDocumentResponse(updated);
}

async function deleteDocument(id) {
    if (!id) {
        throw createValidationError('id là bắt buộc');
    }

    const existing = await documentRepository.findDocumentById(id);
    if (!existing) {
        throw createNotFoundError('Văn bản không tồn tại');
    }

    await documentRepository.deleteDocumentById(id);
    return { id, deleted: true };
}

async function getDocumentStats() {
    return documentRepository.countDocumentsByStatus();
}

module.exports = {
    getAllDocuments,
    getDocumentById,
    createDocument,
    updateDocumentStatus,
    submitDocumentToLeader,
    deleteDocument,
    getDocumentStats
};