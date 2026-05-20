const express = require('express');
const managerController = require('../controllers/managerController');
const checkRole = require('../middleware/checkRole');
const { ROLES } = require('../constants/enums');

const router = express.Router();

/**
 * Manager module - RESTful API skeleton
 *
 * Core use cases:
 * - Phân task cho department
 * - Xem danh sách task đã giao
 * - Xem chi tiết task
 * - Nhận task từ Leader giao xuống
 * - Xem tiến trình xử lý task
 * - Xem báo cáo tiến độ từ chuyên viên
 * - Cập nhật trạng thái task
 * - Hủy task
 * - Duyệt / Từ chối task
 *
 * Role guard is kept as a placeholder for later enablement.
 */

// Tasks
router.get('/tasks', /* checkRole([ROLES.MANAGER]), */ managerController.getAllTasks);

router.post('/tasks/:taskId/receive', /* checkRole([ROLES.MANAGER]), */ managerController.receiveTaskFromLeader);
router.get('/tasks/:taskId/progress', /* checkRole([ROLES.MANAGER]), */ managerController.getTaskProgress);
router.get('/tasks/:taskId/reports', /* checkRole([ROLES.MANAGER]), */ managerController.getProgressReports);
router.patch('/tasks/:taskId/status', /* checkRole([ROLES.MANAGER]), */ managerController.updateTaskStatus);
router.delete('/tasks/:taskId', /* checkRole([ROLES.MANAGER]), */ managerController.cancelTask);
router.post('/tasks/:taskId/approve', /* checkRole([ROLES.MANAGER]), */ managerController.approveTask);
router.post('/tasks/:taskId/reject', /* checkRole([ROLES.MANAGER]), */ managerController.rejectTask);


router.post('/tasks', /* checkRole([ROLES.MANAGER]), */ managerController.createTask);
router.get('/tasks/my', checkRole([ROLES.MANAGER]), managerController.getTasksByManagerId);

// Backward-compatible aliases for future frontend integration
router.get('/task/all', /* checkRole([ROLES.MANAGER]), */ managerController.getAllTasks);
router.get('/task/:taskId', /* checkRole([ROLES.MANAGER]), */ managerController.getTaskById);
router.post('/task/create', /* checkRole([ROLES.MANAGER]), */ managerController.createTask);
router.post('/task/receive', /* checkRole([ROLES.MANAGER]), */ managerController.receiveTaskFromLeader);
router.post('/task/approve', /* checkRole([ROLES.MANAGER]), */ managerController.approveTask);
router.post('/task/reject', /* checkRole([ROLES.MANAGER]), */ managerController.rejectTask);
router.patch('/task/:taskId/status', /* checkRole([ROLES.MANAGER]), */ managerController.updateTaskStatus);
router.delete('/task/:taskId', /* checkRole([ROLES.MANAGER]), */ managerController.cancelTask);

module.exports = router;
