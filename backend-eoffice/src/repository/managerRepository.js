const { Op } = require('sequelize');
const Task = require('../models/taskModel');
const User = require('../models/userModel');
const Department = require('../models/departmentModel');
const Document = require('../models/documentModel');
const DepartmentMember = require('../models/departmentMemberModel');
const TaskFile = require('../models/taskFileModel');
const { TASK_STATUS } = require('../constants/enums');

function normalizeIds(ids = []) {
    return ids.filter(Boolean);
}

async function findDepartmentsByManager(managerId) {
    if (!managerId) {
        return Department.findAll({ raw: true });
    }

    return Department.findAll({
        where: { managerId },
        raw: true
    });
}

// Tìm các DepartmentMember liên kết tới manager
async function findDepartmentMembersByManager(managerId) {
    const departments = await findDepartmentsByManager(managerId);
    const departmentIds = departments.map((item) => item.id);

    if (!departmentIds.length) {
        return [];
    }

    return DepartmentMember.findAll({
        where: {
            departmentId: {
                [Op.in]: departmentIds
            }
        },
        raw: true
    });
}

async function findAssignedTasks(filters = {}) {
    const where = {};

    // Get tasks for manager's scope
    if (filters.managerId) {
        const memberIds = await findDepartmentMembersByManager(filters.managerId);
        if (memberIds.length) {
            where.memberId = {
                [Op.in]: memberIds.map(m => m.id)
            };
        } else {
            return [];
        }
    }

    const departmentIds = normalizeIds(filters.departmentIds);
    if (departmentIds.length) {
        // Lọc theo departmentId thông qua DepartmentMember
        const members = await DepartmentMember.findAll({
            where: {
                departmentId: {
                    [Op.in]: departmentIds
                }
            },
            attributes: ['id'],
            raw: true
        });

        where.memberId = {
            [Op.in]: members.map(m => m.id)
        };
    }

    return Task.findAll({
        where,
        include: [
            {
                model: DepartmentMember,
                as: 'member',
                attributes: ['id', 'departmentId', 'userId'],
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email']
                }]
            },
            {
                model: Document,
                as: 'document',
                attributes: ['id', 'documentNumber', 'title']
            },
            {
                model: TaskFile,
                as: 'files',
                attributes: ['id', 'nameFile', 'url']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
}

// Subtasks không còn (parentId bị xóa)
async function findSubTasks(filters = {}) {
    return [];
}

async function findMembersForManagerScope(managerId) {
    const departments = await findDepartmentsByManager(managerId);
    const departmentIds = departments.map((item) => item.id);

    if (!departmentIds.length) {
        return User.findAll({
            attributes: ['id', 'fullName', 'role', 'email'],
            where: {
                role: {
                    [Op.in]: ['SPECIALIST', 'MANAGER']
                }
            },
            raw: true
        });
    }

    const mappings = await DepartmentMember.findAll({
        where: {
            departmentId: {
                [Op.in]: departmentIds
            }
        },
        raw: true
    });

    const userIds = mappings.map((item) => item.userId);

    if (!userIds.length) {
        return [];
    }

    return User.findAll({
        attributes: ['id', 'fullName', 'role', 'email'],
        where: {
            id: {
                [Op.in]: userIds
            }
        },
        raw: true
    });
}

async function findMemberTaskStats(memberIds = []) {
    const ids = normalizeIds(memberIds);
    if (!ids.length) {
        return [];
    }

    return Task.findAll({
        where: {
            memberId: {
                [Op.in]: ids
            }
        },
        attributes: ['memberId', 'status'],
        raw: true
    });
}

async function createTask(payload) {
    return Task.create(payload);
}

async function findTaskById(taskId) {
    return Task.findByPk(taskId);
}

async function findUserById(userId) {
    if (!userId) {
        return null;
    }

    return User.findByPk(userId);
}

async function findDocumentById(documentId) {
    if (!documentId) {
        return null;
    }

    return Document.findByPk(documentId);
}

async function findDepartmentById(departmentId) {
    if (!departmentId) {
        return null;
    }

    return Department.findByPk(departmentId);
}

async function updateTaskById(taskId, payload) {
    const task = await Task.findByPk(taskId);
    if (!task) {
        return null;
    }

    await task.update(payload);
    return task;
}

module.exports = {
    findDepartmentsByManager,
    findAssignedTasks,
    findSubTasks,
    findMembersForManagerScope,
    findMemberTaskStats,
    createTask,
    findTaskById,
    findUserById,
    findDocumentById,
    findDepartmentById,
    updateTaskById
};