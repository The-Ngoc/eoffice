const Task = require('../models/taskModel');
const TaskFile = require('../models/taskFileModel');
const DepartmentMember = require('../models/departmentMemberModel');
const Document = require('../models/documentModel');
const User = require('../models/userModel');

async function findMemberByUserId(userId) {
    if (!userId) return null;
    return DepartmentMember.findOne({ where: { userId } });
}

async function findTasksByMemberId(memberId) {
    if (!memberId) return [];

    return Task.findAll({
        where: { memberId },
        include: [
            { model: User, as: 'assigner', attributes: ['id', 'fullName', 'email', 'role'] },
            { model: Document, as: 'document', attributes: ['id', 'documentNumber', 'title'] }
        ],
        order: [['createdAt', 'DESC']]
    });
}

async function findTaskDetail(taskId) {
    if (!taskId) return null;

    return Task.findByPk(taskId, {
        include: [
            { model: User, as: 'assigner', attributes: ['id', 'fullName', 'email', 'role'] },
            {
                model: DepartmentMember,
                as: 'member',
                attributes: ['id', 'departmentId', 'userId'],
                include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'role'] }]
            },
            { model: Document, as: 'document', attributes: ['id', 'documentNumber', 'title'] },
            { model: TaskFile, as: 'files', attributes: ['id', 'nameFile', 'url', 'createdAt'] },

        ]
    });
}

async function updateTaskById(taskId, payload, options = {}) {
    const task = await Task.findByPk(taskId);
    if (!task) return null;
    await task.update(payload, options);
    return task;
}

async function deleteTaskFiles(taskId, options = {}) {
    return TaskFile.destroy({ where: { taskId }, transaction: options.transaction });
}

async function addTaskFiles(files = [], options = {}) {
    if (!files.length) return [];
    return TaskFile.bulkCreate(files, options);
}

async function deleteTaskFileById(taskId, fileId) {
    return TaskFile.destroy({ where: { id: fileId, taskId } });
}

async function findUserById(userId) {
    if (!userId) return null;
    return User.findByPk(userId, { attributes: ['id', 'role', 'fullName', 'email'] });
}

module.exports = {
    findMemberByUserId,
    findTasksByMemberId,
    findTaskDetail,
    updateTaskById,
    deleteTaskFiles,
    addTaskFiles,
    deleteTaskFileById,
    findUserById
};

