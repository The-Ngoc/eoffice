const specialistService = require('../services/specialistService');

function sendSuccess(res, data, message, statusCode = 200) {
    return res.status(statusCode).json({ success: true, data, message });
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

async function getMyTasks(req, res) {
    try {
        const data = await specialistService.getMyTasks(req.query, getRequester(req));
        return sendSuccess(res, data, 'Lấy danh sách task thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function getTaskDetail(req, res) {
    try {
        const data = await specialistService.getTaskDetail(req.params.taskId, getRequester(req));
        return sendSuccess(res, data, 'Lấy chi tiết task thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function updateProgress(req, res) {
    try {
        const data = await specialistService.updateProgress(req.params.taskId, req.body, getRequester(req));
        return sendSuccess(res, data, 'Cập nhật tiến độ thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function addComment(req, res) {
    try {
        const data = await specialistService.addComment(req.params.taskId, req.body, getRequester(req));
        return sendSuccess(res, data, 'Ghi log thành công', 201);
    } catch (error) {
        return sendError(res, error);
    }
}

async function submitTask(req, res) {
    try {
        const data = await specialistService.submitTask(req.params.taskId, req.body, req.files || [], getRequester(req));
        return sendSuccess(res, data, 'Nộp task thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function resubmitTask(req, res) {
    try {
        const data = await specialistService.submitTask(req.params.taskId, req.body, req.files || [], getRequester(req), { resubmit: true });
        return sendSuccess(res, data, 'Gửi lại task thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function deleteTaskFile(req, res) {
    try {
        const data = await specialistService.deleteTaskFile(req.params.taskId, req.params.fileId, getRequester(req));
        return sendSuccess(res, data, 'Xóa file thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

module.exports = {
    getMyTasks,
    getTaskDetail,
    updateProgress,
    addComment,
    submitTask,
    resubmitTask,
    deleteTaskFile
};

