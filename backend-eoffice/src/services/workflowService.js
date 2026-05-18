const Document = require('../models/documentModel');
const Department = require('../models/departmentModel');
const DocumentFlow = require('../models/documentFlowModel');
const DocumentFile = require('../models/documentFileModel');
const { DOCUMENT_STATUS } = require('../constants/enums');

function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function toCamelCaseKey(key) {
    return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function mapKeys(value) {
    if (Array.isArray(value)) {
        return value.map(mapKeys);
    }

    if (!value || typeof value !== 'object') {
        return value;
    }

    const result = {};
    Object.entries(value).forEach(([key, raw]) => {
        result[toCamelCaseKey(key)] = mapKeys(raw);
    });

    return result;
}

function normalizeRecord(record) {
    const plain = record?.get ? record.get({ plain: true }) : record;
    return mapKeys(plain);
}

function pickValue(payload, camelKey, snakeKey) {
    return payload?.[camelKey] ?? payload?.[snakeKey];
}

async function getDocumentsForLeader(query = {}) {
    const where = {};

    if (query.status) {
        where.status = query.status;
    }

    const documents = await Document.findAll({
        where,
        include: [
            {
                model: DocumentFile,
                as: 'files',
                attributes: ['id', 'nameFile', 'url']
            }
        ],
        order: [['updatedAt', 'DESC']]
    });

    return documents.map(normalizeRecord);
}

async function createDocument(payload) {
    const title = pickValue(payload, 'title', 'doc_title');
    const sender = pickValue(payload, 'sender', 'sender_name');
    const type = pickValue(payload, 'type', 'doc_type');

    if (!title || !sender || !type) {
        throw createError('title, sender, type là bắt buộc', 400);
    }

    const document = await Document.create({
        documentNumber: pickValue(payload, 'documentNumber', 'doc_number') || `DOC-${Date.now()}`,
        symbol: pickValue(payload, 'symbol', 'doc_symbol') || '',
        title,
        sender,
        status: pickValue(payload, 'status', 'doc_status') || DOCUMENT_STATUS.DRAFT,
        urgency: pickValue(payload, 'urgency', 'priority_level') || 'Thường',
        priority: pickValue(payload, 'priority', 'priority') || null,
        type,
        description: pickValue(payload, 'description', 'doc_description') || null,
        summary: pickValue(payload, 'summary', 'doc_summary') || null,
        legalWarning: pickValue(payload, 'legalWarning', 'legal_warning') || null
    });

    return normalizeRecord(document);
}

async function updateDocumentStatus(id, payload) {
    const nextStatus = pickValue(payload, 'status', 'new_status');

    if (!id) {
        throw createError('id là bắt buộc', 400);
    }

    if (!nextStatus) {
        throw createError('status là bắt buộc', 400);
    }

    const document = await Document.findByPk(id);
    if (!document) {
        throw createError('Không tìm thấy văn bản', 404);
    }

    await document.update({ status: nextStatus });

    await DocumentFlow.create({
        documentId: document.id,
        departmentId: pickValue(payload, 'departmentId', 'department_id') || null,
        userId: pickValue(payload, 'userId', 'user_id') || null,
        action: pickValue(payload, 'action', 'flow_action') || 'STATUS_UPDATED',
        status: nextStatus,
        note: pickValue(payload, 'note', 'remark') || null,
        processedAt: new Date()
    });

    const updated = await Document.findByPk(id);
    return normalizeRecord(updated);
}

module.exports = {
    getDocumentsForLeader,
    createDocument,
    updateDocumentStatus
};