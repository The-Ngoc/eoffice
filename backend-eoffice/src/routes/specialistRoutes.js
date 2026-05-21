const express = require('express');
const specialistController = require('../controllers/specialistController');
const { uploadDocumentFile } = require('../middleware/documentUpload');

const router = express.Router();

router.get('/tasks', specialistController.getMyTasks);
router.get('/tasks/:taskId', specialistController.getTaskDetail);

router.post('/tasks/:taskId/progress', specialistController.updateProgress);
router.post('/tasks/:taskId/comment', specialistController.addComment);

router.post('/tasks/:taskId/submit', uploadDocumentFile.array('files'), specialistController.submitTask);
router.post('/tasks/:taskId/resubmit', uploadDocumentFile.array('files'), specialistController.resubmitTask);
router.delete('/tasks/:taskId/files/:fileId', specialistController.deleteTaskFile);

module.exports = router;

