require('dotenv').config();

function getCloudinaryConfig() {
    const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
    const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim();
    const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim();
    const folder = String(process.env.CLOUDINARY_FOLDER || 'eoffice').trim();
    const uploadPreset = String(process.env.CLOUDINARY_UPLOAD_PRESET || '').trim();
    const secure = String(process.env.CLOUDINARY_SECURE || 'true').trim().toLowerCase() !== 'false';

    return {
        cloudName,
        apiKey,
        apiSecret,
        folder,
        uploadPreset,
        secure,
        apiBaseUrl: cloudName ? `https://api.cloudinary.com/v1_1/${cloudName}` : null,
        resourceBaseUrl: cloudName ? `https://res.cloudinary.com/${cloudName}` : null
    };
}

function validateCloudinaryConfig() {
    const config = getCloudinaryConfig();
    const missingFields = [];

    if (!config.cloudName) missingFields.push('CLOUDINARY_CLOUD_NAME');
    if (!config.apiKey) missingFields.push('CLOUDINARY_API_KEY');
    if (!config.apiSecret) missingFields.push('CLOUDINARY_API_SECRET');

    if (missingFields.length > 0) {
        const error = new Error(`Thiếu cấu hình Cloudinary: ${missingFields.join(', ')}. Hãy thêm vào file .env.`);
        error.statusCode = 500;
        throw error;
    }

    return config;
}

module.exports = {
    getCloudinaryConfig,
    validateCloudinaryConfig
};