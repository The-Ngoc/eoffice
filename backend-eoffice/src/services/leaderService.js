const leaderRepository = require('../repository/leaderRepository');
const taskDepartmentRepository = require('../repository/taskDepartmentRepository');
const { DOCUMENT_STATUS } = require('../constants/enums');

const VALID_STATUSES = Object.values(DOCUMENT_STATUS);

function createValidationError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function createNotFoundError(message) {
    const error = new Error(message);
    error.statusCode = 404;
    return error;
}

function toIso(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toISOString();
}

function normalizeDocument(document) {
    if (!document) {
        return null;
    }

    const plain = document.get ? document.get({ plain: true }) : document;

    let legalWarning = plain.legalWarning ?? plain.legal_warning ?? null;

    const response = {
        id: plain.id,
        documentNumber: plain.documentNumber || plain.docNumber || null,
        symbol: plain.symbol || null,
        title: plain.title,
        sender: plain.sender,
        description: plain.description || null,
        status: plain.status,
        urgency: plain.urgency || null,
        priority: plain.priority || null,
        type: plain.type || null,
        summary: plain.summary || null,
        legalWarning,
        createdAt: toIso(plain.createdAt),
        updatedAt: toIso(plain.updatedAt)
    };

    // Include files if available
    if (plain.files && Array.isArray(plain.files)) {
        response.files = plain.files.map(f => ({
            id: f.id,
            nameFile: f.nameFile,
            url: f.url
        }));
    }

    // Include flow history if available
    if (plain.flowHistories && Array.isArray(plain.flowHistories)) {
        response.flowHistories = plain.flowHistories.map(f => ({
            id: f.id,
            departmentId: f.departmentId,
            userId: f.userId,
            status: f.status,
            action: f.action,
            processedAt: f.processedAt,
            note: f.note
        }));
    }

    return response;
}

function normalizeDepartment(department) {
    if (!department) {
        return null;
    }

    const plain = department.get ? department.get({ plain: true }) : department;

    return {
        id: plain.id,
        name: plain.name,
        managerId: plain.managerId || plain.manager_id,
        managerName: plain.managerName || plain.manager_name,
        createdAt: toIso(plain.createdAt),
        updatedAt: toIso(plain.updatedAt)
    };
}

function isPendingStatus(status) {
    return status === DOCUMENT_STATUS.PENDING_LEADER;
}

function isApprovedStatus(status) {
    return status === DOCUMENT_STATUS.APPROVED;
}

function validateStatus(status) {
    if (!VALID_STATUSES.includes(status)) {
        throw createValidationError(`status phải là một trong: ${VALID_STATUSES.join(', ')}`);
    }
}

async function getPendingDocuments() {
    const documents = await leaderRepository.findPendingDocuments();
    return documents.map(normalizeDocument);
}

async function approveDocument(id) {
    if (!id) {
        throw createValidationError('id là bắt buộc');
    }

    const document = await leaderRepository.findDocumentById(id);
    if (!document) {
        throw createNotFoundError('Không tìm thấy văn bản cần duyệt');
    }

    const currentStatus = document.status;
    if (currentStatus !== DOCUMENT_STATUS.PENDING_LEADER) {
        throw createValidationError('Chỉ văn bản ở trạng thái PENDING_LEADER mới được duyệt');
    }

    await leaderRepository.updateDocumentStatus(id, DOCUMENT_STATUS.APPROVED);

    await leaderRepository.createFlowHistory({
        documentId: id,
        action: 'APPROVED',
        status: DOCUMENT_STATUS.APPROVED,
        note: 'Đã duyệt',
        processedAt: new Date(),
        departmentId: null,
        userId: null
    });

    const updated = await leaderRepository.findDocumentById(id);
    return normalizeDocument(updated);
}

async function rejectDocument(id, reason) {
    if (!id) {
        throw createValidationError('id là bắt buộc');
    }

    if (!reason || !String(reason).trim()) {
        throw createValidationError('reason là bắt buộc');
    }

    const document = await leaderRepository.findDocumentById(id);
    if (!document) {
        throw createNotFoundError('Không tìm thấy văn bản cần từ chối');
    }

    const updated = await leaderRepository.updateDocumentStatus(id, DOCUMENT_STATUS.REJECTED, {
        summary: String(reason).trim()
    });

    await leaderRepository.createFlowHistory({
        documentId: id,
        action: 'REJECTED',
        status: DOCUMENT_STATUS.REJECTED,
        note: String(reason).trim(),
        processedAt: new Date(),
        departmentId: null,
        userId: null
    });

    return normalizeDocument(updated);
}

async function assignDepartmentTask(payload = {}) {
    const documentId = String(payload.docId || payload.documentId || '').trim();
    const managerId = String(payload.managerId || '').trim();
    const directionDescription = String(payload.directionDescription || '').trim();

    if (!documentId) {
        throw createValidationError('docId là bắt buộc');
    }

    if (!directionDescription) {
        throw createValidationError('directionDescription là bắt buộc');
    }

    if (!managerId) {
        throw createValidationError('managerId là bắt buộc');
    }

    const document = await leaderRepository.findDocumentById(documentId);
    if (!document) {
        throw createNotFoundError('Không tìm thấy văn bản');
    }

    const department = await leaderRepository.findDepartmentByManagerId(managerId);
    if (!department) {
        throw createNotFoundError('Không tìm thấy phòng ban của trưởng phòng');
    }

    const existingTask = await taskDepartmentRepository.findTaskDepartmentByDocumentAndManager(documentId, managerId);
    if (existingTask) {
        throw createValidationError('Task cho trưởng phòng này đã tồn tại');
    }

    const created = await taskDepartmentRepository.createTaskDepartment({
        documentId,
        managerId,
        note: directionDescription
    });

    return {
        id: created.id,
        documentId: created.documentId,
        managerId: created.managerId,
        note: created.note,
        directionDescription,
        department: normalizeDepartment(department)
    };
}

async function getDepartments() {
    const departments = await leaderRepository.findDepartments();
    return departments.map(normalizeDepartment);
}

async function getDepartmentManager(deptId) {
    if (!deptId) {
        throw createValidationError('deptId là bắt buộc');
    }

    const department = await leaderRepository.findDepartmentById(deptId);
    if (!department) {
        throw createNotFoundError('Không tìm thấy phòng ban');
    }

    const plain = normalizeDepartment(department);
    return {
        id: plain.id,
        deptId: plain.id,
        name: plain.name,
        managerId: plain.managerId,
        managerName: plain.managerName,
        manager: {
            id: plain.managerId,
            name: plain.managerName
        }
    };
}

async function getStats() {
    const [totalDocs, pendingApprovals, approvedDocs, completedDocs, completedItems] = await Promise.all([
        leaderRepository.countDocuments(),
        leaderRepository.countDocumentsByStatus([DOCUMENT_STATUS.PENDING_LEADER]),
        leaderRepository.countDocumentsByStatus([DOCUMENT_STATUS.APPROVED]),
        leaderRepository.countDocumentsByStatus([DOCUMENT_STATUS.COMPLETED]),
        leaderRepository.findDocumentsByStatus([DOCUMENT_STATUS.COMPLETED])
    ]);

    const processingTime = completedItems.length === 0
        ? 0
        : Number((completedItems.reduce((total, item) => {
            const created = new Date(item.createdAt);
            const updated = new Date(item.updatedAt);
            if (Number.isNaN(created.getTime()) || Number.isNaN(updated.getTime())) {
                return total;
            }

            const days = Math.max(0, (updated - created) / (1000 * 60 * 60 * 24));
            return total + days;
        }, 0) / completedItems.length).toFixed(1));

    const processedDocs = approvedDocs + completedDocs;
    const efficiency = totalDocs === 0 ? 0 : Number(((processedDocs / totalDocs) * 100).toFixed(1));

    return {
        totalDocs,
        pendingApprovals,
        approvedDocs,
        completedDocs,
        processingTime: `${processingTime} ngày`,
        efficiency
    };
}

async function getApprovedDocuments() {
    const documents = await leaderRepository.findDocumentsByStatusWithDetails([DOCUMENT_STATUS.APPROVED]);
    return documents.map(normalizeDocument);
}

module.exports = {
    getPendingDocuments,
    getApprovedDocuments,
    approveDocument,
    rejectDocument,
    assignDepartmentTask,
    getDepartments,
    getDepartmentManager,
    getStats,
    normalizeDocument,
    normalizeDepartment,
    validateStatus,
    isPendingStatus,
    isApprovedStatus
};
