const express = require('express');
const managerController = require('../controllers/managerController');
const checkRole = require('../middleware/checkRole');
const { ROLES } = require('../constants/enums');

const router = express.Router();

router.get('/tasks/assigned', managerController.getAssignedTasks);
router.get('/tasks/sub', managerController.getSubTasks);
router.get('/members', managerController.getMembers);
router.post('/task/assign', managerController.assignTask);
router.post('/task/status', managerController.updateTaskStatus);
router.get('/stats', managerController.getStats);

module.exports = router;