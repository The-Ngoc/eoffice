const ocrService = require('./ocr.service');
const parserService = require('./parser.service');
const summarizerService = require('./summarizer.service');

/**
 * Document Processing Pipeline (Phương án B)
 * Luồng: OCR (Azure) → Normalize → Parse (Regex) → Summarize (Gemini)
 */

/**
 * Process document end-to-end
 * @param {Object} file - multer file {buffer, mimetype, originalname}
 * @returns {Promise<Object>} Structured document result
 */
async function processDocument(file) {
    try {
        console.log('\n🚀 Pipeline: Bắt đầu xử lý tài liệu');
        console.log('═'.repeat(60));

        // STEP 1: Azure OCR → Raw text
        console.log('📍 Bước 1: Extract raw text via Azure OCR');
        const ocrResult = await ocrService.extractRawText(file);
        const { rawText, totalPages, totalTables, hasKeyValuePairs } = ocrResult;

        // STEP 2: Regex parsing → Structured fields
        console.log('📍 Bước 2: Parse fields via Regex');
        const parsed = parserService.parseDocument(rawText);
        const {
            documentNumber,
            symbol,
            issueDate,
            sender,
            title,
            type
        } = parsed;

        // STEP 3: Gemini summarization → Summary only
        console.log('📍 Bước 3: Generate summary via Gemini');
        const summary = await summarizerService.generateSummary(rawText);

        // STEP 4: Validate extracted data
        console.log('📍 Bước 4: Validate & score results');
        const validation = validateResult({
            documentNumber,
            symbol,
            issueDate,
            sender,
            title,
            type,
            summary
        });

        const quality = calculateQuality({
            documentNumber,
            symbol,
            issueDate,
            sender,
            title,
            type,
            summary
        });

        if (!validation.valid) {
            console.warn('⚠️ Validation issues:', validation.issues.join(', '));
        }

        // STEP 5: Build response
        const result = {
            success: true,
            data: {
                documentNumber: documentNumber || null,
                symbol: symbol || null,
                issueDate: issueDate || null,
                sender: sender || null,
                title: title || null,
                type: type || null,
                summary: summary || null
            },
            _metadata: {
                fileName: file.originalname,
                mimeType: file.mimetype,
                fileSize: file.size,
                extractedAt: new Date().toISOString(),
                pipeline: {
                    ocr: 'azure:prebuilt-document',
                    parser: 'regex:vietnamese-patterns',
                    summarizer: 'gemini:1.5-flash'
                },
                ocrMetadata: {
                    totalPages,
                    totalTables,
                    hasKeyValuePairs,
                    rawTextLength: rawText.length
                },
                validation: {
                    valid: validation.valid,
                    issues: validation.issues
                },
                quality
            }
        };

        console.log(`✅ Pipeline hoàn thành - Quality: ${quality.level} (${quality.score}%)`);
        console.log('═'.repeat(60) + '\n');

        return result;

    } catch (error) {
        console.error('❌ Pipeline error:', error.message);
        const pipelineError = new Error(error.message || 'Lỗi xử lý tài liệu');
        pipelineError.statusCode = error.statusCode || 500;
        throw pipelineError;
    }
}

/**
 * Validate extracted fields
 * @returns {Object} {valid: boolean, issues: string[]}
 */
function validateResult(data) {
    const issues = [];

    // Kiểm tra các field bắt buộc
    if (!data.documentNumber) issues.push('documentNumber không tìm thấy');
    if (!data.symbol) issues.push('symbol không tìm thấy');
    if (!data.issueDate) issues.push('issueDate không tìm thấy');
    if (!data.sender) issues.push('sender không tìm thấy');
    if (!data.title) issues.push('title không tìm thấy');
    if (!data.type) issues.push('type không xác định');

    // Summary là optional nhưng nếu có phải có nội dung
    if (data.summary && data.summary.trim().length < 5) {
        issues.push('summary quá ngắn (< 5 ký tự)');
    }

    return {
        valid: issues.length === 0,
        issues
    };
}

/**
 * Calculate quality score (0-100)
 * Dựa trên % field được trích xuất thành công
 */
function calculateQuality(data) {
    const requiredFields = ['documentNumber', 'symbol', 'issueDate', 'sender', 'title', 'type'];
    const optionalFields = ['summary'];

    // Count filled fields
    const requiredFilled = requiredFields.filter(
        f => data[f] !== null && data[f] !== undefined && String(data[f]).trim() !== ''
    ).length;

    const optionalFilled = optionalFields.filter(
        f => data[f] !== null && data[f] !== undefined && String(data[f]).trim() !== ''
    ).length;

    // Scoring: 60% từ required fields, 40% từ optional
    const requiredScore = (requiredFilled / requiredFields.length) * 60;
    const optionalScore = (optionalFilled / optionalFields.length) * 40;
    const score = Math.round(requiredScore + optionalScore);

    return {
        score,
        filledFields: requiredFilled + optionalFilled,
        totalFields: requiredFields.length + optionalFields.length,
        level:
            score >= 85 ? 'high' :
            score >= 60 ? 'medium' :
            'low'
    };
}

module.exports = {
    processDocument,
    validateResult,
    calculateQuality
};
