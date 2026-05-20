const express = require('express');
const workflowController = require('../controllers/workflowController');
const checkRole = require('../middleware/checkRole');
const { ROLES } = require('../constants/enums');

const router = express.Router();

// DEV MODE: Temporarily bypass role checks for faster local testing.
router.get('/documents', /* checkRole([ROLES.LEADER]), */ workflowController.getDocuments);
router.post('/documents', /* checkRole([ROLES.LEADER]), */ workflowController.createDocument);
router.patch('/documents/:id/status', /* checkRole([ROLES.LEADER, ROLES.MANAGER]), */ workflowController.updateDocumentStatus);
router.post('/documents/transfer', /* checkRole([ROLES.LEADER]), */ workflowController.transferDocument);
router.post('/tasks/assign', /* checkRole([ROLES.MANAGER]), */ workflowController.assignTasks);
router.post('/ai/summarize', /* checkRole([ROLES.LEADER, ROLES.MANAGER, ROLES.SPECIALIST]), */ workflowController.summarize);
router.post('/ai/check-format', /* checkRole([ROLES.LEADER, ROLES.MANAGER, ROLES.SPECIALIST]), */ workflowController.checkFormat);

router.get('/documents/:documentId/flow-history', workflowController.getDocumentFlowHistory);

module.exports = router;
