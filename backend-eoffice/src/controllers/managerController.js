const managerService = require('../services/managerService');

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

function getRequester(req) {
    return {
        id: req.user?.id || req.headers['x-user-id'] || req.headers['user-id'] || req.query?.userId || null,
        role: req.user?.role || req.headers['x-user-role'] || null
    };
}

async function getAssignedTasks(req, res) {
    try {
        const data = await managerService.getAssignedTasks(req.query, getRequester(req));
        return sendSuccess(res, data, 'Lấy danh sách nhiệm vụ được giao thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function getSubTasks(req, res) {
    try {
        const data = await managerService.getSubTasks(req.query, getRequester(req));
        return sendSuccess(res, data, 'Lấy danh sách task con thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function getMembers(req, res) {
    try {
        const data = await managerService.getMembers(req.query, getRequester(req));
        return sendSuccess(res, data, 'Lấy danh sách thành viên thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function assignTask(req, res) {
    try {
        const data = await managerService.assignTask(req.body, getRequester(req));
        return sendSuccess(res, data, 'Phân công task thành công', 201);
    } catch (error) {
        return sendError(res, error);
    }
}

async function updateTaskStatus(req, res) {
    try {
        const data = await managerService.updateTaskStatus(req.body);
        return sendSuccess(res, data, 'Cập nhật trạng thái task thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function getStats(req, res) {
    try {
        const data = await managerService.getStats(req.query, getRequester(req));
        return sendSuccess(res, data, 'Lấy KPI phòng ban thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

module.exports = {
    getAssignedTasks,
    getSubTasks,
    getMembers,
    assignTask,
    updateTaskStatus,
    getStats
};