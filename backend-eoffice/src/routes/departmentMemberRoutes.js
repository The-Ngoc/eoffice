const express = require('express');
const departmentMemberController = require('../controllers/departmentMemberController');
const checkRole = require('../middleware/checkRole');
const { ROLES } = require('../constants/enums');

const router = express.Router();

/**
 * GET /api/departments/:departmentId/members
 * Lấy danh sách thành viên của một department
 */
router.get(
    '/departments/:departmentId/members',
    checkRole([ROLES.MANAGER, ROLES.LEADER]),
    departmentMemberController.getMembersByDepartmentId
);

/**
 * GET /api/members/:memberId
 * Lấy thông tin chi tiết một thành viên
 */
router.get(
    '/members/:memberId',
    checkRole([ROLES.MANAGER, ROLES.LEADER, ROLES.SPECIALIST]),
    departmentMemberController.getMemberById
);

/**
 * POST /api/departments/:departmentId/members
 * Thêm thành viên vào department
 * Body: { userId }
 */
router.post(
    '/departments/:departmentId/members',
    checkRole([ROLES.MANAGER]),
    departmentMemberController.addMemberToDepartment
);

/**
 * DELETE /api/members/:memberId
 * Xóa thành viên khỏi department
 */
router.delete(
    '/members/:memberId',
    checkRole([ROLES.MANAGER]),
    departmentMemberController.removeMemberFromDepartment
);

module.exports = router;
