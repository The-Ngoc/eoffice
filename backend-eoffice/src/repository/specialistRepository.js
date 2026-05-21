const Task = require('../models/taskModel');
const TaskFile = require('../models/taskFileModel');
const TaskHistory = require('../models/taskHistoryModel');
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
            {
                model: TaskHistory,
                as: 'history',
                attributes: ['id', 'type', 'progress', 'content', 'createdAt'],
                include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'role'] }]
            }
        ],
        order: [
            [{ model: TaskHistory, as: 'history' }, 'createdAt', 'DESC']
        ]
    });
}

async function updateTaskById(taskId, payload) {
    const task = await Task.findByPk(taskId);
    if (!task) return null;
    await task.update(payload);
    return task;
}

async function createTaskHistory(payload) {
    return TaskHistory.create(payload);
}

async function deleteTaskFiles(taskId) {
    return TaskFile.destroy({ where: { taskId } });
}

async function addTaskFiles(files = []) {
    if (!files.length) return [];
    return TaskFile.bulkCreate(files);
}

async function deleteTaskFileById(taskId, fileId) {
    return TaskFile.destroy({ where: { id: fileId, taskId } });
}

module.exports = {
    findMemberByUserId,
    findTasksByMemberId,
    findTaskDetail,
    updateTaskById,
    createTaskHistory,
    deleteTaskFiles,
    addTaskFiles,
    deleteTaskFileById
};

