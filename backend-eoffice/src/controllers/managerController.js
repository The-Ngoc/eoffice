const managerService = require('../services/managerService');
const taskDepartmentService = require('../services/taskDepartmentService');

function sendSkeleton(res, data, message) {
    return res.status(501).json({
        success: false,
        data,
        message
    });
}

function sendSuccess(res, data, message, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        data,
        message
    });
}

function sendError(res, error) {
    return res.status(error.statusCode || 500).json({
        success: false,
        data: null,
        message: error.message || 'Lỗi hệ thống'
    });
}

async function getAllTasks(req, res) {
    const data = await managerService.getAllTasks(req.query);
    return sendSkeleton(res, data, 'Manager API skeleton: getAllTasks');
}

async function createTask(req, res) {
    const data = await managerService.createTask(req.body);
    return sendSkeleton(res, data, 'Manager API skeleton: createTask');
}

async function getTaskById(req, res) {
    try {
        const { taskId } = req.params;
        const data = await managerService.getTaskById(taskId);
        return sendSuccess(res, data, 'Lấy chi tiết task thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function receiveTaskFromLeader(req, res) {
    const { taskId } = req.params;
    const data = await managerService.receiveTaskFromLeader(taskId, req.body);
    return sendSkeleton(res, data, 'Manager API skeleton: receiveTaskFromLeader');
}

async function getTaskProgress(req, res) {
    const { taskId } = req.params;
    const data = await managerService.getTaskProgress(taskId);
    return sendSkeleton(res, data, 'Manager API skeleton: getTaskProgress');
}

async function getProgressReports(req, res) {
    const { taskId } = req.params;
    const data = await managerService.getProgressReports(taskId);
    return sendSkeleton(res, data, 'Manager API skeleton: getProgressReports');
}

async function updateTaskStatus(req, res) {
    const { taskId } = req.params;
    const data = await managerService.updateTaskStatus(taskId, req.body);
    return sendSkeleton(res, data, 'Manager API skeleton: updateTaskStatus');
}

async function cancelTask(req, res) {
    const { taskId } = req.params;
    const data = await managerService.cancelTask(taskId, req.body);
    return sendSkeleton(res, data, 'Manager API skeleton: cancelTask');
}

async function approveTask(req, res) {
    const { taskId } = req.params;
    const data = await managerService.approveTask(taskId, req.body);
    return sendSkeleton(res, data, 'Manager API skeleton: approveTask');
}

async function rejectTask(req, res) {
    const { taskId } = req.params;
    const data = await managerService.rejectTask(taskId, req.body);
    return sendSkeleton(res, data, 'Manager API skeleton: rejectTask');
}

async function getTasksByDepartmentId(req, res) {
    try {
        const { departmentId } = req.params;
        const data = await managerService.getTasksByDepartmentId(departmentId);
        return sendSuccess(res, data, 'Lấy danh sách task theo phòng ban thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function getTasksByManagerId(req, res) {
    try {
        const { userId } = req.query;
        const data = await taskDepartmentService.getTasksByManagerId(userId);
        return sendSuccess(res, data, 'Lấy danh sách task theo manager thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

module.exports = {
    getAllTasks,
    createTask,
    getTaskById,
    receiveTaskFromLeader,
    getTaskProgress,
    getProgressReports,
    updateTaskStatus,
    cancelTask,
    approveTask,
    rejectTask,
    getTasksByDepartmentId,
    getTasksByManagerId
};
