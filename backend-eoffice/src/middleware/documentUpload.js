const multer = require('multer');

const allowedMimeTypes = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg'
]);

const allowedExtensions = new Set(['.pdf', '.png', '.jpg', '.jpeg']);

function fileFilter(req, file, cb) {
    const mimeType = String(file.mimetype || '').toLowerCase();
    const originalName = String(file.originalname || '').toLowerCase();
    const hasAllowedExtension = Array.from(allowedExtensions).some((ext) => originalName.endsWith(ext));

    if (allowedMimeTypes.has(mimeType) || hasAllowedExtension) {
        return cb(null, true);
    }

    return cb(new Error('Chỉ hỗ trợ file PDF, PNG, JPG, JPEG'));
}

const uploadDocumentFile = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // Giới hạn kích thước file 20MB
    }
});

module.exports = {
    uploadDocumentFile
};