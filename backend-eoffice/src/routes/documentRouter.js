const express = require('express');
const { uploadDocumentFile } = require('../middleware/documentUpload');
const documentController = require('../controllers/documentController');
const { validateDocumentStatusTransition } = require('../middleware/workflowValidator');
const checkRole = require('../middleware/checkRole');
const { ROLES } = require('../constants/enums');

const router = express.Router();

router.get('/document/all', checkRole([ROLES.ADMIN, ROLES.LEADER, ROLES.MANAGER, ROLES.CLERICAL]), documentController.getAllDocuments);
router.get('/document/stats/status', checkRole([ROLES.ADMIN, ROLES.LEADER, ROLES.MANAGER, ROLES.CLERICAL]), documentController.getDocumentStats);
router.get('/document/:id', checkRole([ROLES.ADMIN, ROLES.LEADER, ROLES.MANAGER, ROLES.CLERICAL, ROLES.SPECIALIST]), documentController.getDocumentById);
router.post('/document/add', checkRole([ROLES.CLERICAL, ROLES.ADMIN]), uploadDocumentFile.array('files'), documentController.addDocument);

router.put('/document/status-approve', checkRole([ROLES.LEADER, ROLES.MANAGER, ROLES.CLERICAL, ROLES.ADMIN]), validateDocumentStatusTransition, documentController.updateDocumentApprove);

// Backward-compatible endpoints used by older FE builds
router.post('/document/update-status', checkRole([ROLES.LEADER, ROLES.MANAGER, ROLES.CLERICAL, ROLES.ADMIN]), validateDocumentStatusTransition, documentController.updateDocumentApprove);
router.put('/document/update-status', checkRole([ROLES.LEADER, ROLES.MANAGER, ROLES.CLERICAL, ROLES.ADMIN]), validateDocumentStatusTransition, documentController.updateDocumentApprove);


router.post('/document/submit-to-leader', checkRole([ROLES.CLERICAL, ROLES.ADMIN]), documentController.submitToLeader);
router.post('/document/:id/seal', checkRole([ROLES.CLERICAL, ROLES.ADMIN]), documentController.sealDocument);
router.post('/document/extract-azure-content', checkRole([ROLES.CLERICAL, ROLES.ADMIN]), uploadDocumentFile.single('file'), documentController.extractAzureContent);
router.delete('/document/delete', checkRole([ROLES.CLERICAL, ROLES.ADMIN]), documentController.deleteDocument);
router.post('/document/delete', checkRole([ROLES.CLERICAL, ROLES.ADMIN]), documentController.deleteDocument);

// Lấy danh sách file đính kèm
router.get('/document/files/:id_document', checkRole([ROLES.ADMIN, ROLES.LEADER, ROLES.MANAGER, ROLES.CLERICAL, ROLES.SPECIALIST]), documentController.getDocumentFiles);

module.exports = router;
