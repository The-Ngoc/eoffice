const { DocumentAnalysisClient } = require('@azure/ai-form-recognizer');
const { AzureKeyCredential } = require('@azure/core-auth');

let cachedClient = null;

/**
 * Azure OCR Service - Extract raw text only
 * Using prebuilt-document model for better structure detection
 */

function getAzureConfig() {
    return {
        endpoint: process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
        key: process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY,
        model: process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL || 'prebuilt-document'
    };
}

function ensureClient() {
    const { endpoint, key } = getAzureConfig();

    if (!endpoint || !key) {
        throw new Error('Thiếu AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT và KEY trong .env');
    }

    if (!cachedClient) {
        console.log('📡 Khởi tạo Azure DocumentAnalysisClient');
        cachedClient = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
    }

    return cachedClient;
}

/**
 * Extract raw text từ file (PDF/Image)
 * @param {Object} file - multer file {buffer, mimetype, originalname}
 * @returns {Promise<Object>} {rawText, totalPages, totalTables, hasKeyValuePairs}
 */
async function extractRawText(file) {
    try {
        if (!file) {
            const err = new Error('File là bắt buộc');
            err.statusCode = 400;
            throw err;
        }

        console.log(`🔍 OCR: Xử lý file "${file.originalname}" (${file.mimetype})`);

        const client = ensureClient();
        const { model } = getAzureConfig();

        // Gọi Azure Document Intelligence
        const poller = await client.beginAnalyzeDocument(model, file.buffer);
        const result = await poller.pollUntilDone();

        // Extract raw text từ tất cả pages
        const rawText = result.content || '';
        const totalPages = result.pages?.length || 0;
        const totalTables = result.tables?.length || 0;
        const hasKeyValuePairs = (result.keyValuePairs?.length || 0) > 0;

        console.log(`✅ OCR hoàn thành: ${totalPages} pages, ${totalTables} tables, keyValuePairs: ${hasKeyValuePairs}`);

        return {
            rawText,
            totalPages,
            totalTables,
            hasKeyValuePairs,
            confidence: 'high'
        };

    } catch (error) {
        console.error('❌ Azure OCR lỗi:', error.message);
        const err = new Error(error.message || 'Lỗi OCR từ Azure');
        err.statusCode = error.statusCode || 502;
        throw err;
    }
}

module.exports = {
    extractRawText
};
