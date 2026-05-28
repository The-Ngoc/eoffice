const express = require('express');
const { uploadDocumentFile } = require('../middleware/documentUpload');
const cloudinaryController = require('../controllers/cloudinaryController');
const checkRole = require('../middleware/checkRole');
const { ROLES } = require('../constants/enums');

const router = express.Router();

router.get('/test-connection', checkRole([ROLES.ADMIN]), cloudinaryController.testConnection);

router.post('/upload', checkRole([ROLES.ADMIN, ROLES.CLERICAL, ROLES.MANAGER, ROLES.SPECIALIST]), uploadDocumentFile.any(), cloudinaryController.upload);

module.exports = router;
