const managerRepository = require('../repository/managerRepository');
const { DOCUMENT_STATUS, TASK_STATUS, PRIORITY } = require('../constants/enums');

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function pickValue(payload, key) {
    return payload?.[key];
}

function normalizeRecord(record) {
    return record?.get ? record.get({ plain: true }) : record;
}

function mapAssignedDocumentAsTask(document) {
    const item = normalizeRecord(document);
    return {
        id: item.id,
        title: item.title,
        priority: item.priority || 'Medium',
        status: item.status,
        deadline: item.endTime || item.arrivalDate || null,
        assigneeId: null,
        sender: item.sender,
        createdAt: item.createdAt,
        parentId: null,
        departmentId: item.assignedDepartmentId || null,
        type: item.type || null
    };
}

function mapTask(task) {
    const item = normalizeRecord(task);
    return {
        id: item.id,
        title: item.title,
        priority: item.priority || 'Medium',
        status: item.status,
        deadline: item.dueDate || null,
        assigneeId: item.assigneeId,
        sender: item.sender || item.createdBy || null,
        createdAt: item.createdAt,
        parentId: item.parentId || null,
        departmentId: item.departmentId || null,
        documentId: item.documentId || null,
        attachments: []
    };
}

function mapMember(member) {
    const item = normalizeRecord(member);
    return {
        id: item.id,
        name: item.fullName,
        role: item.role,
        email: item.email,
        avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(item.id)}`,
        departmentId: item.departmentId || '',
        completedTasks: item.completedTasks || 0,
        totalTasks: item.totalTasks || 0
    };
}

async function getScopeDepartments(managerId) {
    const departments = await managerRepository.findDepartmentsByManager(managerId);
    return departments || [];
}

function resolveManagerId(query = {}, user = {}) {
    return query.managerId || query.userId || user.id || null;
}

function ensureManagerScope(query = {}, user = {}) {
    const managerId = resolveManagerId(query, user);
    if (!managerId) {
        throw createError('Thiếu managerId để xác định phạm vi dữ liệu', 400);
    }

    return managerId;
}

async function getAssignedTasks(query = {}, user = {}) {
    const managerId = ensureManagerScope(query, user);
    const departments = await getScopeDepartments(managerId);
    const departmentIds = departments.map((item) => item.id);

    const tasks = await managerRepository.findAssignedTasks({ managerId, departmentIds });
    return tasks.map(mapTask);
}

async function getSubTasks(query = {}, user = {}) {
    const managerId = ensureManagerScope(query, user);
    const departments = await getScopeDepartments(managerId);
    const departmentIds = departments.map((item) => item.id);

    const tasks = await managerRepository.findSubTasks({
        parentId: query.parentId || null,
        departmentIds
    });

    return tasks.map(mapTask);
}

async function getMembers(query = {}, user = {}) {
    const managerId = ensureManagerScope(query, user);
    const members = await managerRepository.findMembersForManagerScope(managerId);
    const statsRows = await managerRepository.findMemberTaskStats(members.map((item) => item.id));

    const statsMap = new Map();
    statsRows.forEach((row) => {
        const current = statsMap.get(row.assigneeId) || { totalTasks: 0, completedTasks: 0 };
        current.totalTasks += 1;
        if (row.status === TASK_STATUS.DONE) {
            current.completedTasks += 1;
        }
        statsMap.set(row.assigneeId, current);
    });

    return members.map((member) => {
        const stat = statsMap.get(member.id) || { totalTasks: 0, completedTasks: 0 };
        return mapMember({
            ...member,
            completedTasks: stat.completedTasks,
            totalTasks: stat.totalTasks
        });
    });
}

async function assignTask(payload = {}, user = {}) {
    const title = pickValue(payload, 'title');
    const assigneeId = pickValue(payload, 'assigneeId');
    const parentId = pickValue(payload, 'parentId') || null;

    if (!title || !assigneeId) {
        throw createError('title và assigneeId là bắt buộc');
    }

    let parentTask = null;
    if (parentId) {
        parentTask = await managerRepository.findTaskById(parentId);
        if (!parentTask) {
            throw createError('parentId không tồn tại', 404);
        }
    }

    const documentId = pickValue(payload, 'documentId') || parentTask?.documentId || null;
    if (!documentId) {
        throw createError('documentId là bắt buộc');
    }

    const assignee = await managerRepository.findUserById(assigneeId);
    if (!assignee) {
        throw createError('assigneeId không tồn tại', 400);
    }

    const document = await managerRepository.findDocumentById(documentId);
    if (!document) {
        throw createError('documentId không tồn tại', 404);
    }

    const departmentId = pickValue(payload, 'departmentId') || parentTask?.departmentId || null;
    if (departmentId) {
        const department = await managerRepository.findDepartmentById(departmentId);
        if (!department) {
            throw createError('departmentId không tồn tại', 400);
        }
    }

    let creatorId = user.id || pickValue(payload, 'createdBy') || null;
    if (creatorId) {
        const creator = await managerRepository.findUserById(creatorId);
        if (!creator) {
            creatorId = null;
        } else {
            creatorId = creator.id;
        }
    }

    const data = {
        documentId,
        departmentId,
        assigneeId,
        title,
        description: pickValue(payload, 'description') || null,
        priority: pickValue(payload, 'priority') || PRIORITY.MEDIUM,
        status: pickValue(payload, 'status') || TASK_STATUS.TODO,
        dueDate: pickValue(payload, 'deadline') || pickValue(payload, 'dueDate') || null,
        createdBy: creatorId,
        sender: pickValue(payload, 'sender') || null,
        parentId
    };

    const task = await managerRepository.createTask(data);
    return mapTask(task);
}

async function updateTaskStatus(payload = {}) {
    const taskId = pickValue(payload, 'taskId');
    const status = pickValue(payload, 'status');

    if (!taskId || !status) {
        throw createError('taskId và status là bắt buộc');
    }

    const task = await managerRepository.updateTaskById(taskId, { status });
    if (!task) {
        throw createError('Không tìm thấy task', 404);
    }

    return mapTask(task);
}

async function getStats(query = {}, user = {}) {
    const managerId = ensureManagerScope(query, user);
    const departments = await getScopeDepartments(managerId);
    const departmentIds = departments.map((item) => item.id);

    const [documents, tasks] = await Promise.all([
        managerRepository.findAssignedTasks({ managerId, departmentIds }),
        managerRepository.findSubTasks({ departmentIds })
    ]);

    const totalDocs = documents.length;
    const pendingApprovals = documents.filter((doc) => {
        return doc.status === DOCUMENT_STATUS.DRAFT || doc.status === DOCUMENT_STATUS.PENDING_LEADER;
    }).length;

    const completedTasks = tasks.filter((task) => {
        return task.status === TASK_STATUS.DONE;
    });

    const processingTime = completedTasks.length === 0
        ? 0
        : Number((completedTasks.reduce((total, task) => {
            const created = new Date(task.createdAt);
            const updated = new Date(task.updatedAt);

            if (Number.isNaN(created.getTime()) || Number.isNaN(updated.getTime())) {
                return total;
            }

            return total + Math.max(0, (updated - created) / (1000 * 60 * 60 * 24));
        }, 0) / completedTasks.length).toFixed(1));

    const efficiency = tasks.length === 0
        ? 0
        : Number(((completedTasks.length / tasks.length) * 100).toFixed(1));

    return {
        totalDocs,
        pendingApprovals,
        processingTime: `${processingTime} ngày`,
        efficiency
    };
}

module.exports = {
    getAssignedTasks,
    getSubTasks,
    getMembers,
    assignTask,
    updateTaskStatus,
    getStats
};