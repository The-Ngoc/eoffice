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
 * 
 * t
 * 
 * - Cập nhật trạng thái task
 * - Hủy task
 * - Duyệt / Từ chối task
 *
 * Role guard is kept as a placeholder for later enablement.
 */

router.get('/tasks/my', checkRole([ROLES.MANAGER]), managerController.getTasksByManagerId);

module.exports = router;
