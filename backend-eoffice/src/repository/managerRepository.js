const { Op } = require('sequelize');
const Task = require('../models/taskModel');
const User = require('../models/userModel');
const Department = require('../models/departmentModel');
const Document = require('../models/documentModel');
const DepartmentMember = require('../models/departmentMemberModel');
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


async function findAssignedTasks(filters = {}) {
    const where = {
        parentId: null
    };

    if (filters.managerId) {
        where.assigneeId = filters.managerId;
    }

    const departmentIds = normalizeIds(filters.departmentIds);
    if (departmentIds.length) {
        where.departmentId = {
            [Op.in]: departmentIds
        };
    }

    return Task.findAll({
        where,
        order: [['createdAt', 'DESC']],
        raw: true
    });
}

async function findSubTasks(filters = {}) {
    const where = {};
    where.parentId = {
        [Op.ne]: null
    };

    const departmentIds = normalizeIds(filters.departmentIds);

    if (departmentIds.length) {
        where.departmentId = {
            [Op.in]: departmentIds
        };
    }

    if (filters.parentId) {
        where.parentId = filters.parentId;
    }

    return Task.findAll({
        where,
        order: [['createdAt', 'DESC']],
        raw: true
    });
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

async function findMemberTaskStats(userIds = []) {
    const ids = normalizeIds(userIds);
    if (!ids.length) {
        return [];
    }

    return Task.findAll({
        where: {
            assigneeId: {
                [Op.in]: ids
            },
            parentId: {
                [Op.ne]: null
            }
        },
        attributes: ['assigneeId', 'status'],
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