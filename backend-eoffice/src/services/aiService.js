const axios = require('axios');

/**
 * Lấy cấu hình Gemini từ environment variables
 */
function getGeminiConfig() {
    const endpoint = process.env.GOOGLE_GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta';
    const apiKey = process.env.GOOGLE_API_KEY;
    const model = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.0-flash';

    return {
        endpoint,
        apiKey,
        model
    };
}

/**
 * Xây dựng system prompt cho Gemini
 */
function buildSystemPrompt() {
    return `Bạn là một chuyên gia xử lý văn bản và tài liệu hành chính.

Nhiệm vụ: Đọc nội dung văn bản được trích xuất từ Azure Document Intelligence và trích xuất thông tin cốt lõi để trả về một JSON đúng định dạng.

Yêu cầu:
1. Trích xuất CHÍNH XÁC các trường được yêu cầu
2. Nếu không tìm thấy thông tin, hãy đặt giá trị mặc định là "--"
3. Trường "content" phải là tóm tắt ngắn gọn những ý chính (tối đa 300 ký tự)
4. Trả về CHÍNH XÁC 1 JSON object, không có text bổ sung
5. Không bao gồm backticks hoặc code block markers

Trả về JSON với cấu trúc sau:
{
  "docNumber": "Số văn bản/số hiệu",
  "symbol": "Ký hiệu của văn bản",
  "type": "Loại văn bản (Công văn, Thông tư, Quyết định, v.v.)",
  "title": "Tiêu đề/Chủ đề chính của văn bản",
  "content": "Tóm tắt ý chính và nội dung quan trọng",
  "sender": "Đơn vị/Người gửi/Cơ quan phát hành"
}`;
}

/**
 * Xây dựng user prompt cho Gemini
 */
function buildUserPrompt(documentContent) {
    return `Đây là nội dung văn bản được trích xuất từ Azure:

${documentContent}

Hãy phân tích và trả về JSON với các trường: docNumber, symbol, type, title, content, sender.`;
}

/**
 * Xây dựng fallback structure khi không thể xử lý từ Gemini
 */
function buildFallbackStructure(rawContent = '') {
    return {
        docNumber: '--',
        symbol: '--',
        type: 'Tài liệu',
        title: 'Tài liệu từ Azure',
        content: rawContent.substring(0, 300) || 'Không thể tóm tắt nội dung',
        sender: '--'
    };
}

/**
 * Parse JSON response từ Gemini
 */
function parseGeminiResponse(responseText) {
    try {
        const cleaned = String(responseText || '').trim();
        
        // Thử match JSON object từ response
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        // Nếu không tìm thấy, trả về null
        return null;
    } catch (error) {
        console.error('Lỗi parse JSON từ Gemini:', error.message);
        return null;
    }
}

/**
 * Validate JSON structure từ Gemini
 */
function validateStructure(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const requiredFields = ['docNumber', 'symbol', 'type', 'title', 'content', 'sender'];
    return requiredFields.every((field) => field in data);
}

/**
 * Gửi content tới Gemini để xử lý và trích xuất thông tin
 */
async function extractStructuredData(documentContent) {
    if (!documentContent || String(documentContent).trim().length === 0) {
        throw new Error('Nội dung tài liệu trống');
    }

    const { endpoint, apiKey, model } = getGeminiConfig();

    if (!apiKey) {
        throw new Error('Thiếu GOOGLE_API_KEY trong .env');
    }

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(documentContent);
    const url = `${endpoint}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
        const body = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: systemPrompt + '\n\n' + userPrompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1500
            }
        };

        console.log('📤 Gửi request tới Gemini API...');
        const response = await axios.post(url, body, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        // Parse Gemini response
        const geminiData = response.data || {};
        let textOutput = null;

        if (geminiData?.candidates && geminiData.candidates.length > 0) {
            const candidate = geminiData.candidates[0];
            if (candidate?.content?.parts && candidate.content.parts.length > 0) {
                textOutput = candidate.content.parts.map((part) => part?.text || '').join('');
            }
        }

        if (!textOutput) {
            console.warn('⚠️ Gemini response rỗng, sử dụng fallback');
            return buildFallbackStructure(documentContent);
        }

        // Parse JSON từ response
        const parsed = parseGeminiResponse(textOutput);
        if (parsed && validateStructure(parsed)) {
            console.log('✅ Trích xuất thành công từ Gemini');
            return parsed;
        }

        console.warn('⚠️ Gemini response không hợp lệ, sử dụng fallback');
        return buildFallbackStructure(documentContent);

    } catch (error) {
        const statusCode = error?.response?.status;
        const errorData = error?.response?.data;
        const errorMessage = errorData?.error?.message || error?.message || 'Lỗi gọi Gemini API';

        console.error('❌ Lỗi gọi Gemini:', {
            statusCode,
            message: errorMessage,
            timestamp: new Date().toISOString()
        });

        // Xử lý các lỗi cụ thể
        if (statusCode === 429) {
            console.warn('⚠️ Quota Gemini vượt mức, trả về fallback');
            return buildFallbackStructure(documentContent);
        }

        if (statusCode === 401 || statusCode === 403) {
            throw new Error(`Lỗi xác thực Gemini: ${errorMessage}`);
        }

        // Với các lỗi khác, vẫn trả về fallback để API không fail toàn bộ
        console.warn('⚠️ Gemini API lỗi, trả về fallback');
        return buildFallbackStructure(documentContent);
    }
}

module.exports = {
    extractStructuredData,
    getGeminiConfig
};
