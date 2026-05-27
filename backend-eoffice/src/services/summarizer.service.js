const axios = require('axios');

/**
 * Summarizer Service - Gemini API
 * CHỈ dùng để tóm tắt nội dung (max 150 ký tự)
 * Không extract structured fields
 */

const GEMINI_CONFIG = {
    endpoint: process.env.GOOGLE_GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    apiKey: process.env.GOOGLE_API_KEY,
    model: process.env.GOOGLE_GEMINI_MODEL || 'gemini-1.5-flash'
};

/**
 * Generate summary bằng Gemini
 * @param {string} documentContent - Raw text từ OCR
 * @returns {Promise<string>} Summary (max 150 ký tự)
 */
async function generateSummary(documentContent) {
    try {
        if (!GEMINI_CONFIG.apiKey) {
            console.warn('⚠️ GOOGLE_API_KEY không được cấu hình, trả content snippet');
            return getContentSnippet(documentContent);
        }

        console.log('🤖 Calling Gemini API for summarization...');

        const prompt = `Bạn là chuyên gia tóm tắt tài liệu hành chính Việt Nam.

Tóm tắt nội dung tài liệu dưới đây trong TỐI ĐA 150 ký tự. 
Hãy viết tóm tắt bằng cách hiểu của bạn, không copy-paste từ văn bản gốc.

VĂN BẢN:
${documentContent}

TÓM TẮT (tối đa 150 ký tự):`;

        const response = await axios.post(GEMINI_CONFIG.endpoint, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 500
            }
        }, {
            params: { key: GEMINI_CONFIG.apiKey },
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });

        const summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!summary || summary.trim().length === 0) {
            console.warn('⚠️ Gemini trả response rỗng, dùng snippet');
            return getContentSnippet(documentContent);
        }

        console.log(`✅ Summary generated: ${summary.length} chars`);
        return summary.trim().substring(0, 150);

    } catch (error) {
        console.error('❌ Gemini error:', error.message);

        // Phân biệt loại error
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.error('❌ Auth error - API key sai/hết hạn');
            throw new Error('Gemini authentication failed');
        }

        if (error.response?.status === 429) {
            console.warn('⚠️ Rate limit - fallback to snippet');
            return getContentSnippet(documentContent);
        }

        // Timeout hoặc network error → fallback
        console.warn('⚠️ Gemini error, fallback to snippet');
        return getContentSnippet(documentContent);
    }
}

/**
 * Fallback: lấy 150 ký tự đầu tiên từ content
 */
function getContentSnippet(content) {
    if (!content) return '';

    const normalized = content
        .replace(/\s+/g, ' ')
        .trim();

    return normalized.substring(0, 150);
}

module.exports = {
    generateSummary,
    getContentSnippet
};
