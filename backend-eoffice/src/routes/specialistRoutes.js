const express = require('express');
const specialistController = require('../controllers/specialistController');
const { uploadDocumentFile } = require('../middleware/documentUpload');
const checkRole = require('../middleware/checkRole');
const { ROLES } = require('../constants/enums');

const router = express.Router();

router.get('/tasks', checkRole([ROLES.SPECIALIST]), specialistController.getMyTasks);
router.get('/tasks/:taskId', checkRole([ROLES.SPECIALIST]), specialistController.getTaskDetail);

router.post('/tasks/:taskId/progress', checkRole([ROLES.SPECIALIST]), specialistController.updateProgress);
router.post('/tasks/:taskId/comment', checkRole([ROLES.SPECIALIST]), specialistController.addComment);

router.post(
	'/tasks/:taskId/submit',
	checkRole([ROLES.SPECIALIST]),
	uploadDocumentFile.array('files'),
	specialistController.submitTask
);
router.post(
	'/tasks/:taskId/resubmit',
	checkRole([ROLES.SPECIALIST]),
	uploadDocumentFile.array('files'),
	specialistController.resubmitTask
);
router.delete('/tasks/:taskId/files/:fileId', checkRole([ROLES.SPECIALIST]), specialistController.deleteTaskFile);

module.exports = router;

