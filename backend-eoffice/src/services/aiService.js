const axios = require('axios');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true, removeAdditional: false });

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

function buildSystemPrompt() {
  return `Bạn là hệ thống trích xuất dữ liệu văn bản hành chính Việt Nam với độ chính xác cao.

BẮT BUỘC làm theo các bước sau:

BƯỚC 1: Tìm các pattern rõ ràng trong văn bản

- documentNumber:
  Tìm dòng chứa "Số:"
  Regex: Số:\\s*(\\S+)
  Ví dụ: "Số: 1800/KH-ĐHL" → "1800/KH-ĐHL"

- symbol:
  Lấy phần sau dấu "/" trong documentNumber
  Ví dụ: "1800/KH-ĐHL" → "KH-ĐHL"

- issueDate:
  Tìm dòng chứa "ngày ... tháng ... năm ..."
  Chuyển về format YYYY-MM-DD

- sender:
  Lấy dòng in hoa đầu tiên ở đầu văn bản
  (BỘ..., UBND..., TRƯỜNG...)

- title:
  Lấy dòng in hoa lớn nằm giữa văn bản (ví dụ: KẾ HOẠCH, QUYẾT ĐỊNH)

BƯỚC 2: Xác định type từ title
- "KẾ HOẠCH" → Kế hoạch
- "QUYẾT ĐỊNH" → Quyết định
- "CÔNG VĂN" → Công văn
- "BÁO CÁO" → Báo cáo

BƯỚC 3: Tóm tắt (summary)
- Viết lại nội dung chính (không copy)
- Tối đa 150 ký tự

BẮT BUỘC:
- Không được bỏ qua thông tin rõ ràng
- Không được trả "--"
- Không được copy nguyên văn vào summary
- Không thêm giải thích

OUTPUT:

{
  "documentNumber": "...",
  "symbol": "...",
  "type": "...",
  "title": "...",
  "summary": "...",
  "sender": "...",
}`;
}

function buildUserPrompt(documentContent) {
  return `Phân tích văn bản sau và trích xuất thông tin theo yêu cầu:

${documentContent}

Chỉ trả về JSON hợp lệ.`;
}

// JSON schema để validate output từ Gemini
const structuredSchema = {
    type: 'object',
    properties: {
        documentNumber: { type: 'string' },
        symbol: { type: 'string' },
        type: { type: 'string' },
        title: { type: 'string' },
        summary: { type: 'string' },
        sender: { type: 'string' },
    },
    required: ['documentNumber', 'symbol', 'type', 'title', 'summary', 'sender'],
    additionalProperties: false
};

const validateSchema = ajv.compile(structuredSchema);

/**
 * Xây dựng fallback structure khi không thể xử lý từ Gemini
 */
function buildFallbackStructure(rawContent = '') {
    return {
        documentNumber: '--',
        symbol: '--',
        type: 'Tài liệu',
        title: 'Tài liệu từ Azure',
        summary: rawContent.substring(0, 200) || 'Không thể tóm tắt nội dung',
        sender: '--',
    };
}

/**
 * Parse JSON response từ Gemini
 */
function parseGeminiResponse(responseText) {
    try {
        const cleaned = String(responseText || '').trim();

        // 1) Thử parse thẳng
        try {
            return JSON.parse(cleaned);
        } catch (e) {
            // tiếp tục
        }

        // 2) Nếu model bọc thêm text, thử match JSON object
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                return null;
            }
        }

        // 3) Nếu model trả mảng chứa object
        const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            try {
                const arr = JSON.parse(arrayMatch[0]);
                if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object') return arr[0];
            } catch (e) {
                // ignore
            }
        }

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
    if (!data || typeof data !== 'object') return false;

    const valid = validateSchema(data);
    if (!valid) {
        console.warn('⚠️ Schema validation failed:', validateSchema.errors);
    }
    return valid;
}

/**
 * Gửi content tới Gemini để xử lý và trích xuất thông tin
 */
async function extractStructuredData(documentContent) {
    if (!documentContent || String(documentContent).trim().length === 0) {
        throw new Error('Nội dung tài liệu trống');
    }
    console.log(documentContent.toString());

    const { endpoint, apiKey, model } = getGeminiConfig();

    if (!apiKey) {
        throw new Error('Thiếu GOOGLE_API_KEY trong .env');
    }

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(documentContent);
    const url = `${endpoint}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    // Retry config
    const maxRetries = 3;
    const baseDelay = 800; // ms

    // Prepare request body: tách rõ role system và user
    const body = {
        contents: [
            { role: 'system', parts: [{ text: systemPrompt }] },
            { role: 'user', parts: [{ text: userPrompt }] }
        ],
        generationConfig: {
            temperature: 0.0,
            maxOutputTokens: 1200
        }
    };

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            if (attempt > 0) console.log(`🔁 Thử lại Gemini: attempt=${attempt + 1}`);
            const response = await axios.post(url, body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });

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

            // debug raw response (không log secrets)
            console.debug('Raw Gemini output:', textOutput.substring(0, 1000));

            const parsed = parseGeminiResponse(textOutput);
            if (parsed && validateStructure(parsed)) {
                console.log('✅ Trích xuất thành công từ Gemini');
                return parsed;
            }

            console.warn('⚠️ Gemini response không hợp lệ, attempt:', attempt + 1);
            // Nếu chưa đạt maxRetries, chờ và thử lại
            if (attempt < maxRetries - 1) {
                await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, attempt)));
                continue;
            }

            return buildFallbackStructure(documentContent);

        } catch (error) {
            const statusCode = error?.response?.status;
            const errorData = error?.response?.data;
            const errorMessage = errorData?.error?.message || error?.message || 'Lỗi gọi Gemini API';

            console.error('❌ Lỗi gọi Gemini:', {
                statusCode,
                message: errorMessage,
                attempt: attempt + 1,
                timestamp: new Date().toISOString()
            });

            // Nếu 401/403: dừng ngay
            if (statusCode === 401 || statusCode === 403) {
                throw new Error(`Lỗi xác thực Gemini: ${errorMessage}`);
            }

            // Nếu 429 (quota) thì fallback ngay
            if (statusCode === 429) {
                console.warn('⚠️ Quota Gemini vượt mức, trả về fallback');
                return buildFallbackStructure(documentContent);
            }

            // Với các lỗi khác: thử lại theo backoff
            if (attempt < maxRetries - 1) {
                await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, attempt)));
                continue;
            }

            console.warn('⚠️ Gemini API lỗi, trả về fallback');
            return buildFallbackStructure(documentContent);
        }
    }
}

module.exports = {
    extractStructuredData,
    getGeminiConfig
};
