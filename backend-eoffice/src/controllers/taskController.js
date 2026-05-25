const taskService = require('../services/taskService');

/**
 * Helper functions để xử lý response
 */
function sendSuccess(res, data, message, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        data,
        message
    });
}

function sendError(res, error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        data: null,
        message: error.message || 'Lỗi hệ thống'
    });
}

/**
 * GET /api/tasks
 * Lấy tất cả Task với phân trang
 * Query: status, priority, memberId, page, limit
 */
async function getAllTasks(req, res) {
    try {
        const tasks = await taskService.getAllTasks(req.query);
        return sendSuccess(res, tasks, 'Lấy danh sách task thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

/**
 * GET /api/tasks/:taskId
 * Lấy thông tin chi tiết một Task
 */
async function getTaskById(req, res) {
    try {
        const { taskId } = req.params;
        const task = await taskService.getTaskById(taskId);
        return sendSuccess(res, task, 'Lấy thông tin task thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

/**
 * POST /api/tasks
 * Tạo mới Task
 * Body: { documentId, memberId, assignerId, title, description, priority, dueDate, note }
 */
async function createTask(req, res) {
    try {
        const newTask = await taskService.createNewTask(req.body, req.files || []);
        return sendSuccess(res, newTask, 'Tạo task thành công', 201);
    } catch (error) {
        return sendError(res, error);
    }
}

/**
 * PATCH /api/tasks/:taskId
 * Cập nhật Task
 */
async function updateTask(req, res) {
    try {
        const { taskId } = req.params;
        const updatedTask = await taskService.updateExistingTask(taskId, req.body);
        return sendSuccess(res, updatedTask, 'Cập nhật task thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

/**
 * DELETE /api/tasks/:taskId
 * Xóa Task
 */
async function deleteTask(req, res) {
    try {
        const { taskId } = req.params;
        const result = await taskService.deleteTask(taskId);
        return sendSuccess(res, result, 'Xóa task thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

/**
 * GET /api/tasks/member/:memberId
 * Lấy danh sách task theo memberId
 * Query: status, page, limit
 */
async function getTasksByMemberId(req, res) {
    try {
        const { memberId } = req.params;
        const tasks = await taskService.getTasksByMemberId(memberId, req.query);
        return sendSuccess(res, tasks, 'Lấy danh sách task theo thành viên thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    getTasksByMemberId
};
