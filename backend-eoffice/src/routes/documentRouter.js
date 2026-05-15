const express = require('express');
const { uploadDocumentFile } = require('../middleware/documentUpload');
const documentController = require('../controllers/documentController');
const { validateDocumentStatusTransition } = require('../middleware/workflowValidator');

const router = express.Router();

router.get('/document/all', documentController.getAllDocuments);
router.get('/document/stats/status', documentController.getDocumentStats);
router.get('/document/:id', documentController.getDocumentById);
router.post('/document/add', documentController.addDocument);
router.put('/document/update-status', validateDocumentStatusTransition, documentController.updateDocumentStatus);
router.post('/document/update-status', validateDocumentStatusTransition, documentController.updateDocumentStatus);
router.post('/document/submit-to-leader', documentController.submitToLeader);
router.post('/document/extract-azure-content', uploadDocumentFile.single('file'), documentController.extractAzureContent);
router.delete('/document/delete', documentController.deleteDocument);
router.post('/document/delete', documentController.deleteDocument);

module.exports = router;