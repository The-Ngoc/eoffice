const multer = require('multer');

const allowedMimeTypes = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown'
]);

const allowedExtensions = new Set([
    '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'
]);

function fileFilter(req, file, cb) {
    const mimeType = String(file.mimetype || '').toLowerCase();
    const originalName = String(file.originalname || '').toLowerCase();
    const hasAllowedExtension = Array.from(allowedExtensions).some((ext) => originalName.endsWith(ext));

    if (allowedMimeTypes.has(mimeType) && hasAllowedExtension) {
        return cb(null, true);
    }

    return cb(new Error('Chỉ hỗ trợ file PDF, ảnh, Word, Excel, PowerPoint, TXT hoặc Markdown hợp lệ'));
}

const uploadDocumentFile = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024
    }
});

module.exports = {
    uploadDocumentFile
};
