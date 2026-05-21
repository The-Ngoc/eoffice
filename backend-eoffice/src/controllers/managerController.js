const taskDepartmentService = require('../services/taskDepartmentService');

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
    getTasksByManagerId
};
