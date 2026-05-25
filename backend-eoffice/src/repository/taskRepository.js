const { Task, Document, DepartmentMember, User, TaskFile } = require('../models');

/**
 * Repository xử lý tất cả các truy vấn liên quan đến Task
 */

/**
 * Lấy tất cả Task
 * @param {Object} query - { status, priority, memberId, page, limit }
 * @returns {Promise<Object>} - { rows, count, total pages }
 */
async function findAllTasks(query = {}) {
    const where = {};
    const limit = parseInt(query.limit) || 10;
    const offset = ((parseInt(query.page) || 1) - 1) * limit;

    if (query.status) {
        where.status = query.status;
    }
    if (query.priority) {
        where.priority = query.priority;
    }
    if (query.memberId) {
        where.memberId = query.memberId;
    }

    const { rows, count } = await Task.findAndCountAll({
        where,
        include: [
            {
                model: Document,
                as: 'document',
                attributes: ['id', 'documentNumber', 'title', 'sender', 'status']
            },
            {
                model: DepartmentMember,
                as: 'member',
                attributes: ['id', 'departmentId'],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'fullName', 'email']
                    }
                ]
            },
            {
                model: User,
                as: 'assigner',
                attributes: ['id', 'fullName', 'email']
            },
            {
                model: TaskFile,
                as: 'files',
                attributes: ['id', 'taskId', 'nameFile', 'url']
            }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
    });

    return {
        rows,
        count,
        totalPages: Math.ceil(count / limit),
        page: parseInt(query.page) || 1,
        limit
    };
}

/**
 * Lấy Task theo ID
 * @param {string} taskId
 * @returns {Promise<Object|null>}
 */
async function findTaskById(taskId) {
    return await Task.findByPk(taskId, {
        include: [
            {
                model: Document,
                as: 'document',
                attributes: ['id', 'documentNumber', 'title', 'sender', 'status', 'urgency']
            },
            {
                model: DepartmentMember,
                as: 'member',
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'fullName', 'email']
                    }
                ]
            },
            {
                model: User,
                as: 'assigner',
                attributes: ['id', 'fullName', 'email']
            },
            {
                model: TaskFile,
                as: 'files'
            },
        ]
    });
}

/**
 * Tạo mới Task
 * @param {Object} data - Dữ liệu Task
 * @returns {Promise<Object>}
 */
async function createTask(data, options = {}) {
    return await Task.create(data, options);
}

/**
 * Cập nhật Task
 * @param {string} taskId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function updateTask(taskId, data, options = {}) {
    const task = await Task.findByPk(taskId);
    if (!task) {
        return null;
    }
    return await task.update(data, options);
}

/**
 * Xóa Task
 * @param {string} taskId
 * @returns {Promise<number>}
 */
async function deleteTask(taskId) {
    return await Task.destroy({
        where: { id: taskId }
    });
}

/**
 * Lấy danh sách Task theo memberId
 * @param {string} memberId
 * @param {Object} query - { status, page, limit }
 * @returns {Promise<Object>}
 */
async function findTasksByMemberId(memberId, query = {}) {
    const where = { memberId };
    const limit = parseInt(query.limit) || 10;
    const offset = ((parseInt(query.page) || 1) - 1) * limit;

    if (query.status) {
        where.status = query.status;
    }

    const { rows, count } = await Task.findAndCountAll({
        where,
        include: [
            {
                model: Document,
                as: 'document',
                attributes: ['id', 'documentNumber', 'title', 'sender', 'status', 'urgency']
            },
            {
                model: DepartmentMember,
                as: 'member',
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'fullName', 'email']
                    }
                ]
            },
            {
                model: User,
                as: 'assigner',
                attributes: ['id', 'fullName', 'email']
            },
            {
                model: TaskFile,
                as: 'files'
            }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
    });

    return {
        rows,
        count,
        totalPages: Math.ceil(count / limit),
        page: parseInt(query.page) || 1,
        limit
    };
}

/**
 * Kiểm tra xem Document tồn tại hay không
 * @param {string} documentId
 * @returns {Promise<Object|null>}
 */
async function findDocumentById(documentId) {
    return await Document.findByPk(documentId);
}

/**
 * Kiểm tra xem DepartmentMember tồn tại hay không
 * @param {string} memberId
 * @returns {Promise<Object|null>}
 */
async function findDepartmentMemberById(memberId) {
    return await DepartmentMember.findByPk(memberId);
}

module.exports = {
    findAllTasks,
    findTaskById,
    createTask,
    updateTask,
    deleteTask,
    findTasksByMemberId,
    findDocumentById,
    findDepartmentMemberById
};
