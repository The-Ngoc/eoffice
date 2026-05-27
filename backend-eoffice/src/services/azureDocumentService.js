const { DocumentAnalysisClient } = require('@azure/ai-form-recognizer');
const { AzureKeyCredential } = require('@azure/core-auth');
const copilotService = require('./aiService');

let cachedClient = null;

function getAzureConfig() {
    return {
        endpoint: process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
        key: process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY,
        model: process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL || 'prebuilt-read'
    };
}

function createValidationError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function createConfigurationError(message) {
    const error = new Error(message);
    error.statusCode = 500;
    return error;
}

function ensureClient() {
    const { endpoint, key } = getAzureConfig();

    if (!endpoint || !key) {
        throw createConfigurationError('Thiếu cấu hình Azure. Hãy điền AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT và AZURE_DOCUMENT_INTELLIGENCE_KEY trong .env');
    }

    if (!cachedClient) {
        console.log('📡 Tạo DocumentAnalysisClient với endpoint:', endpoint);
        cachedClient = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
    }

    return cachedClient;
}

function toLineContent(line) {
    return {
        content: line?.content || '',
        polygon: line?.polygon || null
    };
}

function toPageContent(page) {
    return {
        pageNumber: page?.pageNumber || null,
        angle: page?.angle ?? null,
        width: page?.width ?? null,
        height: page?.height ?? null,
        unit: page?.unit || null,
        lines: Array.isArray(page?.lines) ? page.lines.map(toLineContent) : []
    };
}

function toTableContent(table) {
    return {
        rowCount: table?.rowCount || 0,
        columnCount: table?.columnCount || 0,
        cells: Array.isArray(table?.cells)
            ? table.cells.map((cell) => ({
                rowIndex: cell?.rowIndex ?? null,
                columnIndex: cell?.columnIndex ?? null,
                content: cell?.content || '',
                kind: cell?.kind || null
            }))
            : []
    };
}

function toKeyValuePairContent(pair) {
    return {
        key: pair?.key?.content || '',
        value: pair?.value?.content || '',
        confidence: pair?.confidence ?? null
    };
}

function buildExtractedContent(result, file) {
    const content = result?.content || '';

    return {
        fileName: file.originalname,
        mimeType: file.mimetype,
        model: getAzureConfig().model,
        content,
        paragraphs: Array.isArray(result?.paragraphs)
            ? result.paragraphs.map((paragraph) => paragraph?.content || '').filter(Boolean)
            : [],
        pages: Array.isArray(result?.pages) ? result.pages.map(toPageContent) : [],
        tables: Array.isArray(result?.tables) ? result.tables.map(toTableContent) : [],
        keyValuePairs: Array.isArray(result?.keyValuePairs)
            ? result.keyValuePairs.map(toKeyValuePairContent)
            : [],
        warnings: [
            'Các field Azure đang để placeholder trong .env.',
            'Nếu muốn trích xuất cấu trúc khác, đổi AZURE_DOCUMENT_INTELLIGENCE_MODEL sang model phù hợp.'
        ]
    };
}

async function extractDocumentContent(file) {
    if (!file || !file.buffer) {
        throw createValidationError('File là bắt buộc');
    }


    const client = ensureClient();
    const { model } = getAzureConfig();

    try {
        const poller = await client.beginAnalyzeDocument(model, file.buffer, {
            contentType: file.mimetype
        });

        const result = await poller.pollUntilDone();
        return buildExtractedContent(result, file);
    } catch (error) {
        const message = error?.message || 'Không thể trích xuất nội dung từ Azure';
        const azureError = new Error(message);
        azureError.statusCode = error?.statusCode || 502;
        throw azureError;
    }
}

async function extractAndProcessDocument(file) {
    if (!file || !file.buffer) {
        throw createValidationError('File là bắt buộc');
    }

    try {
        const client = ensureClient();
        const { model } = getAzureConfig();

        const poller = await client.beginAnalyzeDocument(model, file.buffer, {
            contentType: file.mimetype
        });

        const result = await poller.pollUntilDone();
        const rawContent = result?.content || '';
        
        if (!rawContent || String(rawContent).trim().length === 0) {
            throw new Error('Azure không thể trích xuất nội dung từ file');
        }

        console.log('✅ Azure trích xuất thành công');

        // Step 2: Process qua Gemini để lấy structured data
        console.log('📤 Bước 2: Gửi tới Gemini để xử lý và định dạng...');
        const structuredData = await copilotService.extractStructuredData(rawContent);

        
        const result_data = {
            fileName: file.originalname,
            mimeType: file.mimetype,
            extractedAt: new Date().toISOString(),
            data: structuredData,
            _metadata: {
                totalPages: result?.pages?.length || 0,
                totalTables: result?.tables?.length || 0,
                hasKeyValuePairs: (result?.keyValuePairs?.length || 0) > 0,
                processedByGemini: true
            }
        };

        return result_data;

    } catch (error) {
        const statusCode = error?.statusCode || error?.status || 500;
        const message = error?.message || 'Lỗi xử lý văn bản';

        console.error('❌ Lỗi xử lý tài liệu:', {
            statusCode,
            message,
            timestamp: new Date().toISOString()
        });

        const processError = new Error(message);
        processError.statusCode = statusCode;
        throw processError;
    }
}

module.exports = {
    extractDocumentContent,
    extractAndProcessDocument
};