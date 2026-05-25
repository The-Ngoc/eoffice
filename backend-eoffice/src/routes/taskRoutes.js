const express = require('express');
const taskController = require('../controllers/taskController');
const checkRole = require('../middleware/checkRole');
const { uploadDocumentFile } = require('../middleware/documentUpload');
const { ROLES } = require('../constants/enums');

const router = express.Router();

/**
 * GET /api/tasks
 * Lấy tất cả Task với phân trang và lọc
 * Query: status, priority, memberId, page, limit
 */
router.get(
    '/tasks',
    /* checkRole([ROLES.MANAGER, ROLES.LEADER, ROLES.SPECIALIST]), */ 
    taskController.getAllTasks
);

/**
 * GET /api/tasks/:taskId
 * Lấy thông tin chi tiết một Task
 */
router.get(
    '/tasks/:taskId',
    /* checkRole([ROLES.MANAGER, ROLES.LEADER, ROLES.SPECIALIST]), */ 
    taskController.getTaskById
);

/**
 * POST /api/tasks
 * Tạo mới Task
 * Body: {
 *   documentId (required),
 *   memberId (required),
 *   title (required),
 *   description (optional),
 *   assignerId (optional),
 *   priority (optional),
 *   dueDate (optional),
 *   status (optional),
 *   progress (optional),
 *   note (optional)
 * }
 */
router.post(
    '/new-task',
    uploadDocumentFile.array('files'),
    /* checkRole([ROLES.MANAGER, ROLES.LEADER]), */ 
    taskController.createTask
);

/**
 * PATCH /api/tasks/:taskId
 * Cập nhật Task
 * Body: Any fields that need updating
 */
router.patch(
    '/tasks/:taskId',
    /* checkRole([ROLES.MANAGER, ROLES.LEADER, ROLES.SPECIALIST]), */ 
    taskController.updateTask
);

/**
 * DELETE /api/tasks/:taskId
 * Xóa Task
 */
router.delete(
    '/tasks/:taskId',
    /* checkRole([ROLES.MANAGER, ROLES.LEADER]), */ 
    taskController.deleteTask
);

/**
 * GET /api/tasks/member/:memberId
 * Lấy danh sách task theo memberId
 * Query: status, page, limit
 */
router.get(
    '/tasks/member/:memberId',
    /* checkRole([ROLES.MANAGER, ROLES.LEADER, ROLES.SPECIALIST]), */ 
    taskController.getTasksByMemberId
);

module.exports = router;
