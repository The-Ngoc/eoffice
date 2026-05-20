const express = require('express');
const leaderController = require('../controllers/leaderController');
const checkRole = require('../middleware/checkRole');
const { ROLES } = require('../constants/enums');

const router = express.Router();

// DEV MODE: Temporarily bypass role checks for faster local testing.
router.get('/documents/waiting-leader', /* checkRole([ROLES.LEADER]), */ leaderController.getWailtingLeader);
router.get('/documents/pending', /* checkRole([ROLES.LEADER]), */ leaderController.getWailtingLeader);
router.get('/documents/wailting-leader', /* checkRole([ROLES.LEADER]), */ leaderController.getWailtingLeader);
router.get('/documents/approved', /* checkRole([ROLES.LEADER]), */ leaderController.getApprovedDocuments);
router.post('/document/approve', /* checkRole([ROLES.LEADER]), */ leaderController.approve);
router.post('/document/reject', /* checkRole([ROLES.LEADER]), */ leaderController.reject);

//Ok
router.post('/document/assign-department', /* checkRole([ROLES.LEADER]), */ leaderController.assignDepartment);


router.get('/departments', /* checkRole([ROLES.LEADER, ROLES.MANAGER, ROLES.SPECIALIST]), */ leaderController.getDepartments);
router.get('/department/manager/:deptId', /* checkRole([ROLES.LEADER, ROLES.MANAGER, ROLES.SPECIALIST]), */ leaderController.getDepartmentManager);
router.get('/stats', /* checkRole([ROLES.LEADER]), */ leaderController.getStats);
router.get('/stats/dept-performance', /* checkRole([ROLES.LEADER]), */ leaderController.getDeptPerformance);

// Backward-compatible aliases for current frontend/tests
router.get('/wailting-leader', /* checkRole([ROLES.LEADER]), */ leaderController.getWailtingLeader);
router.post('/approve', /* checkRole([ROLES.LEADER]), */ leaderController.approve);
router.post('/reject', /* checkRole([ROLES.LEADER]), */ leaderController.reject);

module.exports = router;