const Document = require('../models/documentModel');
const Department = require('../models/departmentModel');
const DocumentFlow = require('../models/documentFlowModel');
const Task = require('../models/taskModel');
const User = require('../models/userModel');
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
        order: [['updatedAt', 'DESC']]
    });

    return documents.map(normalizeRecord);
}

async function createDocument(payload) {
    const docNumber = pickValue(payload, 'docNumber', 'doc_number');
    const symbol = pickValue(payload, 'symbol', 'doc_symbol');
    const title = pickValue(payload, 'title', 'doc_title');
    const sender = pickValue(payload, 'sender', 'sender_name');
    const arrivalDate = pickValue(payload, 'arrivalDate', 'arrival_date');
    const type = pickValue(payload, 'type', 'doc_type');

    if (!docNumber || !symbol || !title || !sender || !arrivalDate || !type) {
        throw createError('docNumber, symbol, title, sender, arrivalDate, type là bắt buộc', 400);
    }

    const document = await Document.create({
        docNumber,
        symbol,
        title,
        sender,
        status: pickValue(payload, 'status', 'doc_status') || DOCUMENT_STATUS.DRAFT,
        urgency: pickValue(payload, 'urgency', 'priority_level') || 'Thường',
        arrivalDate,
        type,
        isOverdue: Boolean(pickValue(payload, 'isOverdue', 'is_overdue')),
        flow: Array.isArray(pickValue(payload, 'flow', 'flow_steps')) ? pickValue(payload, 'flow', 'flow_steps') : []
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
        managerId: pickValue(payload, 'managerId', 'manager_id') || null,
        action: pickValue(payload, 'action', 'flow_action') || 'STATUS_UPDATED',
        status: nextStatus,
        note: pickValue(payload, 'note', 'remark') || null,
        processedAt: new Date()
    });

    const updated = await Document.findByPk(id);
    return normalizeRecord(updated);
}

async function transferDocument(payload) {
    const documentId = pickValue(payload, 'documentId', 'document_id');
    const departmentId = pickValue(payload, 'departmentId', 'department_id');
    const action = pickValue(payload, 'action', 'flow_action') || 'TRANSFERRED';
    const status = pickValue(payload, 'status', 'flow_status') || DOCUMENT_STATUS.ASSIGNED;
    const note = pickValue(payload, 'note', 'remark') || null;

    if (!documentId || !departmentId) {
        throw createError('documentId và departmentId là bắt buộc', 400);
    }

    const document = await Document.findByPk(documentId);
    if (!document) {
        throw createError('Không tìm thấy văn bản', 404);
    }

    const department = await Department.findOne({
        where: { id: departmentId }
    });

    if (!department) {
        throw createError('Không tìm thấy phòng ban', 404);
    }

    const flow = Array.isArray(document.flow) ? document.flow : [];
    const nextFlow = {
        id: String(Date.now()),
        departmentId: department.id,
        user: department.managerId,
        action,
        time: new Date().toISOString(),
        status
    };

    flow.push(nextFlow);

    await document.update({
        status: 'PROCESSING',
        flow
    });

    const flowRecord = await DocumentFlow.create({
        documentId: document.id,
        departmentId: department.id,
        managerId: department.managerId,
        action,
        status,
        note,
        processedAt: new Date()
    });

    return {
        document: normalizeRecord(document),
        flow: normalizeRecord(flowRecord),
        receiverId: department.managerId,
        department: normalizeRecord(department)
    };
}

async function assignTasks(payload) {
    const documentId = pickValue(payload, 'documentId', 'document_id');
    const tasksInput = pickValue(payload, 'tasks', 'task_items');

    if (!documentId || !Array.isArray(tasksInput) || tasksInput.length === 0) {
        throw createError('documentId và tasks là bắt buộc', 400);
    }

    const document = await Document.findByPk(documentId);
    if (!document) {
        throw createError('Không tìm thấy văn bản', 404);
    }

    const defaultDepartmentId = pickValue(payload, 'departmentId', 'department_id') || null;
    const requestedCreatorId = pickValue(payload, 'createdBy', 'created_by') || null;

    const assigneeIds = [];
    const departmentIds = [];

    tasksInput.forEach((task, index) => {
        const assigneeId = pickValue(task, 'assigneeId', 'assignee_id');
        const title = pickValue(task, 'title', 'task_title');
        const departmentId = pickValue(task, 'departmentId', 'department_id') || defaultDepartmentId;

        if (!assigneeId) {
            throw createError(`tasks[${index}].assigneeId là bắt buộc`, 400);
        }

        if (!title) {
            throw createError(`tasks[${index}].title là bắt buộc`, 400);
        }

        assigneeIds.push(assigneeId);
        if (departmentId) {
            departmentIds.push(departmentId);
        }
    });

    const uniqueAssigneeIds = [...new Set(assigneeIds)];
    const uniqueDepartmentIds = [...new Set(departmentIds)];

    if (uniqueAssigneeIds.length > 0) {
        const existingAssignees = await User.findAll({
            where: { id: uniqueAssigneeIds },
            attributes: ['id'],
            raw: true
        });

        const existingAssigneeIds = new Set(existingAssignees.map((item) => item.id));
        const missingAssigneeId = uniqueAssigneeIds.find((id) => !existingAssigneeIds.has(id));
        if (missingAssigneeId) {
            throw createError(`assigneeId không tồn tại: ${missingAssigneeId}`, 400);
        }
    }

    if (uniqueDepartmentIds.length > 0) {
        const existingDepartments = await Department.findAll({
            where: { id: uniqueDepartmentIds },
            attributes: ['id'],
            raw: true
        });

        const existingDepartmentIds = new Set(existingDepartments.map((item) => item.id));
        const missingDepartmentId = uniqueDepartmentIds.find((id) => !existingDepartmentIds.has(id));
        if (missingDepartmentId) {
            throw createError(`departmentId không tồn tại: ${missingDepartmentId}`, 400);
        }
    }

    let creatorId = null;
    if (requestedCreatorId) {
        const creator = await User.findByPk(requestedCreatorId, { attributes: ['id'] });
        if (!creator) {
            throw createError('createdBy không tồn tại trong bảng users', 400);
        }
        creatorId = creator.id;
    }

    const createdTasks = await Task.bulkCreate(
        tasksInput.map((task) => ({
            documentId: document.id,
            departmentId: pickValue(task, 'departmentId', 'department_id') || defaultDepartmentId,
            assigneeId: pickValue(task, 'assigneeId', 'assignee_id'),
            title: pickValue(task, 'title', 'task_title'),
            description: pickValue(task, 'description', 'task_description') || null,
            status: pickValue(task, 'status', 'task_status') || 'OPEN',
            dueDate: pickValue(task, 'dueDate', 'due_date') || null,
            createdBy: creatorId
        }))
    );

    return createdTasks.map(normalizeRecord);
}

async function summarizeDocument(payload) {
    const documentId = pickValue(payload, 'documentId', 'document_id');

    if (!documentId) {
        throw createError('documentId là bắt buộc', 400);
    }

    const document = await Document.findByPk(documentId);
    if (!document) {
        throw createError('Không tìm thấy văn bản', 404);
    }

    const plain = normalizeRecord(document);

    return {
        documentId: plain.id,
        source: {
            title: plain.title,
            docNumber: plain.docNumber,
            symbol: plain.symbol,
            sender: plain.sender,
            urgency: plain.urgency,
            status: plain.status,
            content: plain.content || null
        },
        aiSummary: null,
        prompt: {
            provider: 'openai-or-gemini',
            task: 'summarize-document',
            expectedOutput: {
                aiSummary: 'string',
                keyPoints: ['string'],
                riskNotes: ['string']
            }
        }
    };
}

async function checkFormat(payload) {
    const documentId = pickValue(payload, 'documentId', 'document_id');

    if (!documentId) {
        throw createError('documentId là bắt buộc', 400);
    }

    const document = await Document.findByPk(documentId);
    if (!document) {
        throw createError('Không tìm thấy văn bản', 404);
    }

    const plain = normalizeRecord(document);

    return {
        documentId: plain.id,
        title: plain.title,
        content: plain.content || null,
        validationRules: {
            spellCheck: true,
            formatStandard: 'US-236',
            marginCheck: true,
            layoutCheck: true
        },
        prompt: {
            provider: 'openai-or-gemini',
            task: 'check-document-format',
            expectedOutput: {
                isValid: 'boolean',
                errors: ['string'],
                warnings: ['string']
            }
        }
    };
}

module.exports = {
    getDocumentsForLeader,
    createDocument,
    updateDocumentStatus,
    transferDocument,
    assignTasks,
    summarizeDocument,
    checkFormat
};