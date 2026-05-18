const axios = require('axios');
const crypto = require('crypto');
const { validateCloudinaryConfig, getCloudinaryConfig } = require('../config/cloudinary');

function createServiceError(message, statusCode = 500, details = null) {
    const error = new Error(message);
    error.statusCode = statusCode;
    if (details) {
        error.details = details;
    }
    return error;
}

function toDataUri(fileBuffer, mimeType = 'application/octet-stream') {
    if (!Buffer.isBuffer(fileBuffer)) {
        throw createServiceError('fileBuffer phải là Buffer hợp lệ', 400);
    }

    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

function buildUploadSignature(params, apiSecret) {
    const keys = Object.keys(params)
        .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
        .sort();

    const query = keys.map((key) => `${key}=${params[key]}`).join('&');
    return crypto.createHash('sha1').update(query + apiSecret).digest('hex');
}

function getUploadEndpoint() {
    const config = validateCloudinaryConfig();
    return `${config.apiBaseUrl}`;
}

async function uploadBufferToCloudinary(fileBuffer, fileName, options = {}) {
    try {
        const config = validateCloudinaryConfig();

        if (!fileBuffer) {
            throw createServiceError('fileBuffer là bắt buộc', 400);
        }

        const mimeType = options.contentType || 'application/octet-stream';
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const folder = options.folder || config.folder;
        const dataUri = toDataUri(fileBuffer, mimeType);

        // Build params for signature (excluding file, api_key, resource_type)
        const signatureParams = {
            timestamp
        };
        // determine resource type for Cloudinary (image vs raw/auto)
        const resourceType = mimeType && String(mimeType).startsWith('image/') ? 'image' : 'raw';
        
        if (folder) {
            signatureParams.folder = folder;
        }
        
        if (fileName) {
            signatureParams.public_id = String(fileName).replace(/\.[^.]+$/, '');
            signatureParams.use_filename = 'true';
            signatureParams.unique_filename = 'false';
        }
        
        if (config.uploadPreset) {
            signatureParams.upload_preset = config.uploadPreset;
        }
        
        const signature = buildUploadSignature(signatureParams, config.apiSecret);
        // Build body params (include all params for the request)
        const bodyParams = {
            ...signatureParams,
            api_key: config.apiKey,
            signature,
            file: dataUri
        };

        const body = new URLSearchParams(bodyParams);

        const uploadUrl = `${getUploadEndpoint()}/${resourceType}/upload`;

        const response = await axios.post(uploadUrl, body.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });


        return {
            success: true,
            assetId: response.data.asset_id,
            publicId: response.data.public_id,
            version: response.data.version,
            resourceType: response.data.resource_type,
            format: response.data.format,
            bytes: response.data.bytes,
            width: response.data.width,
            height: response.data.height,
            secureUrl: response.data.secure_url,
            url: response.data.url,
            originalFilename: response.data.original_filename,
            folder: response.data.folder,
            createdAt: response.data.created_at,
            fileName: fileName || response.data.original_filename
        };
    } catch (error) {
        const responseData = error.response?.data;
        console.error('❌ Lỗi upload Cloudinary:', {
            status: error.response?.status,
            data: responseData,
            message: error.message
        });

        throw createServiceError(
            `Upload Cloudinary thất bại: ${responseData?.error?.message || error.message}`,
            error.response?.status || 500,
            responseData
        );
    }
}

async function deleteAssetFromCloudinary(publicId, resourceType = 'image') {
    try {
        if (!publicId) {
            throw createServiceError('publicId là bắt buộc', 400);
        }

        const config = getCloudinaryConfig();
        validateCloudinaryConfig();

        const url = `${config.apiBaseUrl}/resources/${resourceType}/upload/${encodeURIComponent(publicId)}`;

        const response = await axios.delete(url, {
            auth: {
                username: config.apiKey,
                password: config.apiSecret
            }
        });

        return {
            success: true,
            result: response.data.result,
            publicId: response.data.public_id
        };
    } catch (error) {
        const responseData = error.response?.data;
        console.error('❌ Lỗi xóa Cloudinary asset:', {
            status: error.response?.status,
            data: responseData,
            message: error.message
        });

        throw createServiceError(
            `Xóa Cloudinary asset thất bại: ${responseData?.error?.message || error.message}`,
            error.response?.status || 500,
            responseData
        );
    }
}

module.exports = {
    getCloudinaryConfig,
    uploadBufferToCloudinary,
    deleteAssetFromCloudinary
};