const express = require('express');
const { uploadDocumentFile } = require('../middleware/documentUpload');
const cloudinaryController = require('../controllers/cloudinaryController');

const router = express.Router();

router.get('/test-connection', cloudinaryController.testConnection);

router.post('/upload', uploadDocumentFile.any(), cloudinaryController.upload);

module.exports = router;
