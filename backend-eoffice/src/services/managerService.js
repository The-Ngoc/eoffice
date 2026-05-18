const managerRepository = require('../repository/managerRepository');
const { TASK_STATUS, PRIORITY } = require('../constants/enums');
const { randomUUID } = require('crypto');

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

function mapTask(task) {
    const item = normalizeRecord(task);
    
    const response = {
        id: item.id,
        title: item.title,
        description: item.description || null,
        priority: item.priority || PRIORITY.MEDIUM,
        status: item.status,
        dueDate: item.dueDate || null,
        documentId: item.documentId || null,
        memberId: item.memberId || null,
        assignerId: item.assignerId || null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
    };

    // Include member info if available
    if (item.member) {
        response.member = {
            id: item.member.id,
            departmentId: item.member.departmentId,
            userId: item.member.userId,
            user: item.member.user ? {
                id: item.member.user.id,
                fullName: item.member.user.fullName,
                email: item.member.user.email
            } : null
        };
    }

    // Include document info if available
    if (item.document) {
        response.document = {
            id: item.document.id,
            documentNumber: item.document.documentNumber,
            title: item.document.title
        };
    }

    // Include files if available
    if (item.files && Array.isArray(item.files)) {
        response.files = item.files.map(f => ({
            id: f.id,
            nameFile: f.nameFile,
            url: f.url
        }));
    }

    return response;
}

function mapMember(member) {
    const item = normalizeRecord(member);
    return {
        id: item.id,
        departmentId: item.departmentId,
        userId: item.userId,
        user: item.user ? {
            id: item.user.id,
            fullName: item.user.fullName,
            email: item.user.email,
            role: item.user.role
        } : null,
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
    
    const tasks = await managerRepository.findAssignedTasks({ managerId });
    return tasks.map(mapTask);
}

async function getMembers(query = {}, user = {}) {
    const managerId = ensureManagerScope(query, user);
    const members = await managerRepository.findMembersForManagerScope(managerId);
    const statsRows = await managerRepository.findMemberTaskStats(members.map((item) => item.id));

    const statsMap = new Map();
    statsRows.forEach((row) => {
        const current = statsMap.get(row.memberId) || { totalTasks: 0, completedTasks: 0 };
        current.totalTasks += 1;
        if (row.status === TASK_STATUS.DONE) {
            current.completedTasks += 1;
        }
        statsMap.set(row.memberId, current);
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
    const memberId = pickValue(payload, 'memberId');
    const documentId = pickValue(payload, 'documentId');

    if (!title || !memberId) {
        throw createError('title và memberId là bắt buộc');
    }

    if (!documentId) {
        throw createError('documentId là bắt buộc');
    }

    const document = await managerRepository.findDocumentById(documentId);
    if (!document) {
        throw createError('documentId không tồn tại', 404);
    }

    const data = {
        id: randomUUID(),
        documentId,
        memberId,
        title,
        description: pickValue(payload, 'description') || null,
        priority: pickValue(payload, 'priority') || PRIORITY.MEDIUM,
        status: pickValue(payload, 'status') || TASK_STATUS.TODO,
        dueDate: pickValue(payload, 'dueDate') || null,
        assignerId: user.id || null,
        note: pickValue(payload, 'note') || null,
        isOverdue: false
    };

    const task = await managerRepository.createTask(data);
    return mapTask(task);
}

async function getStats(query = {}, user = {}) {
    const managerId = ensureManagerScope(query, user);
    
    const tasks = await managerRepository.findAssignedTasks({ managerId });

    const totalTasks = tasks.length;
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

    const efficiency = totalTasks === 0
        ? 0
        : Number(((completedTasks.length / totalTasks) * 100).toFixed(1));

    return {
        totalTasks,
        completedTasks: completedTasks.length,
        processingTime: `${processingTime} ngày`,
        efficiency
    };
}

module.exports = {
    getAssignedTasks,
    getMembers,
    assignTask,
    getStats
};