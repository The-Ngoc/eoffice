const cloudinaryService = require('../services/cloudinaryService');

async function testConnection(req, res, next) {
    try {
        const config = cloudinaryService.getCloudinaryConfig();
        return res.status(200).json({
            success: true,
            data: {
                cloudName: config.cloudName,
                apiBaseUrl: config.apiBaseUrl,
                resourceBaseUrl: config.resourceBaseUrl
            },
            message: 'Cloudinary config loaded'
        });
    } catch (err) {
        next(err);
    }
}

async function upload(req, res, next) {
    try {
        const files = req.files || (req.file ? [req.file] : []);
        if (!files || files.length === 0) {
            const error = new Error('File(s) are required');
            error.statusCode = 400;
            throw error;
        }

        const results = [];
        for (const file of files) {
            // Lấy đuôi mở rộng (nếu có)
            const extension = file.originalname.match(/\.[^.]+$/) ? file.originalname.match(/\.[^.]+$/)[0] : '';
            const baseName = String(file.originalname || 'file').replace(/\.[^.]+$/, '');
            const uniqueName = `${baseName}_${Date.now()}${extension}`;

            const uploaded = await cloudinaryService.uploadBufferToCloudinary(
                file.buffer,
                uniqueName,
                {
                    contentType: file.mimetype,
                    folder: undefined
                }
            );

            results.push({ originalName: file.originalname, uploaded });
        }

        return res.status(200).json({ success: true, data: results, message: 'Uploaded to Cloudinary' });
    } catch (err) {
        next(err);
    }
}

module.exports = { testConnection, upload };
