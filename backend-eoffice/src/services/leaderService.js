const leaderRepository = require('../repository/leaderRepository');
const { DOCUMENT_STATUS, SIGNATURE_STATUS, TASK_STATUS } = require('../constants/enums');

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

    let legalWarnings = plain.legalWarnings ?? plain.legal_warnings ?? [];
    if (typeof legalWarnings === 'string') {
        try {
            const parsed = JSON.parse(legalWarnings);
            legalWarnings = Array.isArray(parsed) ? parsed : [legalWarnings];
        } catch (error) {
            legalWarnings = [legalWarnings];
        }
    }

    return {
        id: plain.id,
        docNumber: plain.docNumber || null,
        symbol: plain.symbol || null,
        title: plain.title,
        sender: plain.sender,
        description: plain.description || null,
        location: plain.location || null,
        startTime: toIso(plain.startTime || plain.start_time),
        endTime: toIso(plain.endTime || plain.end_time),
        status: plain.status,
        urgency: plain.urgency || null,
        arrivalDate: plain.arrivalDate || plain.arrival_date || null,
        type: plain.type || null,
        priority: plain.priority || null,
        summary: plain.summary || null,
        content: plain.content || null,
        legalWarnings,
        flow: Array.isArray(plain.flow) ? plain.flow : [],
        assignedDepartmentId: plain.assignedDepartmentId || plain.assigned_department_id || null,
        createdAt: toIso(plain.createdAt),
        updatedAt: toIso(plain.updatedAt)
    };
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

function isProcessingStatus(status) {
    return status === DOCUMENT_STATUS.PROCESSING;
}

function isCompletedStatus(status) {
    return status === DOCUMENT_STATUS.COMPLETED;
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

    if (document.assignedDepartmentId) {
        throw createValidationError('Văn bản đã được gán phòng ban xử lý');
    }

    await leaderRepository.appendFlowStep(id, {
        id: `flow-${Date.now()}`,
        user: 'Leader',
        action: 'APPROVED_WAITING_ASSIGNMENT',
        time: new Date().toISOString(),
        status: 'Current'
    });

    await leaderRepository.createFlowHistory({
        documentId: id,
        action: 'APPROVED_WAITING_ASSIGNMENT',
        status: DOCUMENT_STATUS.APPROVED,
        note: 'Đã duyệt, chờ chuyển phòng ban xử lý',
        processedAt: new Date(),
        departmentId: document.assignedDepartmentId || null,
        managerId: null
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
        summary: String(reason).trim(),
        rejectReason: String(reason).trim()
    });

    await leaderRepository.appendFlowStep(id, {
        id: `flow-${Date.now()}`,
        user: 'Leader',
        action: 'REJECTED',
        time: new Date().toISOString(),
        status: 'Done'
    });

    await leaderRepository.createFlowHistory({
        documentId: id,
        action: 'REJECTED',
        status: DOCUMENT_STATUS.REJECTED,
        note: String(reason).trim(),
        processedAt: new Date(),
        departmentId: updated?.assignedDepartmentId || null,
        managerId: null
    });

    return normalizeDocument(updated);
}

async function assignDepartmentToDocument(docId, deptId, actor = {}) {
    if (!docId || !deptId) {
        throw createValidationError('docId và deptId là bắt buộc');
    }

    const currentDocument = await leaderRepository.findDocumentById(docId);
    if (!currentDocument) {
        throw createNotFoundError('Không tìm thấy văn bản');
    }

    const currentStatus = currentDocument.status;
    if (currentStatus === DOCUMENT_STATUS.PROCESSING || currentStatus === DOCUMENT_STATUS.COMPLETED) {
        throw createValidationError('Văn bản đã được chuyển xử lý trước đó');
    }

    if (currentStatus === DOCUMENT_STATUS.REJECTED) {
        throw createValidationError('Văn bản bị từ chối không thể chuyển phòng ban');
    }

    if (currentStatus !== DOCUMENT_STATUS.PENDING_LEADER && currentStatus !== DOCUMENT_STATUS.APPROVED) {
        throw createValidationError('Chỉ văn bản đang chờ duyệt mới có thể chuyển phòng ban');
    }

    const result = await leaderRepository.assignDepartmentToDocument(docId, deptId);
    if (!result || !result.department || !result.document) {
        throw createNotFoundError('Không tìm thấy dữ liệu hoặc cấu trúc kết quả sai');
    }

    const managerUser = await leaderRepository.findUserById(result.department.managerId);
    if (!managerUser) {
        throw createValidationError('managerId của phòng ban không tồn tại trong bảng users');
    }

    await leaderRepository.appendFlowStep(docId, {
        id: `flow-${Date.now()}`,
        user: actor?.name || 'Leader',
        action: 'ASSIGNED_DEPARTMENT',
        time: new Date().toISOString(),
        status: 'Current'
    });

    await leaderRepository.createFlowHistory({
        documentId: docId,
        action: 'ASSIGNED_DEPARTMENT',
        status: DOCUMENT_STATUS.ASSIGNED,
        note: `Assigned to ${result.department.name}`,
        processedAt: new Date(),
        departmentId: result.department.id,
        managerId: managerUser.id
    });

    const existedTask = await leaderRepository.findManagerAssignedTask(docId, managerUser.id);
    if (!existedTask) {
        const creator = actor?.id ? await leaderRepository.findUserById(actor.id) : null;

        await leaderRepository.createManagerAssignedTask({
            documentId: result.document.id,
            departmentId: result.department.id,
            assigneeId: managerUser.id,
            title: result.document.title,
            description: result.document.summary || result.document.description || null,
            status: TASK_STATUS.TODO,
            priority: result.document.priority || 'Medium',
            dueDate: result.document.endTime || result.document.arrivalDate || null,
            createdBy: creator?.id || null,
            sender: actor?.name || 'Leader',
            parentId: null
        });
    }

    return {
        document: normalizeDocument(result.document),
        department: normalizeDepartment(result.department)
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
    const [totalDocs, pendingApprovals, processingDocs, completedDocs, completedItems] = await Promise.all([
        leaderRepository.countDocuments(),
        leaderRepository.countDocumentsByStatus(['Pending', 'PENDING', 'Urgent', 'URGENT']),
        leaderRepository.countDocumentsByStatus(['Processing', 'PROCESSING']),
        leaderRepository.countDocumentsByStatus(['Completed', 'COMPLETED']),
        leaderRepository.findDocumentsByStatus(['Completed', 'COMPLETED'])
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

    const efficiency = totalDocs === 0 ? 0 : Number((((completedDocs + processingDocs) / totalDocs) * 100).toFixed(1));

    return {
        totalDocs,
        pendingApprovals,
        processingTime: `${processingTime} ngày`,
        efficiency
    };
}

async function getDeptPerformance() {
    const rows = await leaderRepository.getDeptPerformance();

    return rows.map((item) => ({
        name: item.name,
        value: Number(item.value) || 0
    }));
}

module.exports = {
    getPendingDocuments,
    approveDocument,
    rejectDocument,
    assignDepartmentToDocument,
    getDepartments,
    getDepartmentManager,
    getStats,
    getDeptPerformance,
    normalizeDocument,
    normalizeDepartment,
    validateStatus,
    isPendingStatus,
    isProcessingStatus,
    isCompletedStatus
};