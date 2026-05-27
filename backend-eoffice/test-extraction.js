/**
 * Test extraction + summarization
 * Mô phỏng: Azure OCR → Raw text → Gemini Extract Fields + Summary
 */

const fs = require('fs');
const axios = require('axios');

const GEMINI_API = {
    endpoint: process.env.GOOGLE_GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    key: process.env.GOOGLE_API_KEY,
    model: process.env.GOOGLE_GEMINI_MODEL || 'gemini-1.5-flash'
};

/**
 * Test 1: Extract fields từ raw text bằng Gemini
 */
async function testExtraction() {
    try {
        console.log('\n📋 TEST 1: Extract Fields via Gemini');
        console.log('═'.repeat(60));

        const rawText = fs.readFileSync('./test-data.txt', 'utf-8');
        console.log(`📄 Raw text length: ${rawText.length} chars\n`);

        const prompt = `Bạn là chuyên gia trích xuất thông tin từ tài liệu hành chính Việt Nam.

Từ văn bản dưới đây, hãy trích xuất các thông tin sau (nếu không tìm được thì để null):
- documentNumber: Số ký hiệu tài liệu (ví dụ: 1725/KH-ĐHL)
- symbol: Ký hiệu đơn vị (ví dụ: KH-ĐHL, BND, SYT)
- issueDate: Ngày tháng năm (format YYYY-MM-DD)
- sender: Tổ chức/Bộ phát hành
- title: Tiêu đề chính của tài liệu
- type: Loại tài liệu (Kế hoạch, Quyết định, Công văn, Báo cáo, etc.)

Trả lời CHÍNH XÁC dưới dạng JSON:
{
  "documentNumber": "...",
  "symbol": "...",
  "issueDate": "...",
  "sender": "...",
  "title": "...",
  "type": "..."
}

VĂN BẢN:
${rawText}`;

        const response = await axios.post(GEMINI_API.endpoint, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 500
            }
        }, {
            params: { key: GEMINI_API.key },
            headers: { 'Content-Type': 'application/json' }
        });

        const extractedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('✅ Gemini Response (Raw):');
        console.log(extractedText);

        // Parse JSON từ response
        try {
            const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const extracted = JSON.parse(jsonMatch[0]);
                console.log('\n✅ EXTRACTED FIELDS:');
                console.log(JSON.stringify(extracted, null, 2));
                return extracted;
            }
        } catch (parseErr) {
            console.error('⚠️ Không thể parse JSON:', parseErr.message);
        }

    } catch (error) {
        console.error('❌ Extraction Error:', error.response?.data || error.message);
    }
}

/**
 * Test 2: Tóm tắt nội dung bằng Gemini
 */
async function testSummarization() {
    try {
        console.log('\n📝 TEST 2: Summarization via Gemini');
        console.log('═'.repeat(60));

        const rawText = fs.readFileSync('./test-data.txt', 'utf-8');

        const prompt = `Bạn là chuyên gia tóm tắt tài liệu hành chính Việt Nam.

Hãy tóm tắt nội dung văn bản sau trong TỐI ĐA 150 ký tự. Không copy paste, hãy viết lại bằng cách hiểu của bạn:

VĂN BẢN:
${rawText}

TÓM TẮT (tối đa 150 ký tự):`;

        const response = await axios.post(GEMINI_API.endpoint, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 300
            }
        }, {
            params: { key: GEMINI_API.key },
            headers: { 'Content-Type': 'application/json' }
        });

        const summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('✅ Summary:');
        console.log(summary);
        console.log(`\n📊 Length: ${summary.length} characters`);

    } catch (error) {
        console.error('❌ Summarization Error:', error.response?.data || error.message);
    }
}

/**
 * Test 3: Cả hai (mô phỏng endpoint)
 */
async function testFullPipeline() {
    try {
        console.log('\n🚀 TEST 3: Full Pipeline (Extract + Summarize)');
        console.log('═'.repeat(60));

        const rawText = fs.readFileSync('./test-data.txt', 'utf-8');

        const combinedPrompt = `Bạn là chuyên gia trích xuất & tóm tắt tài liệu hành chính Việt Nam.

PHẦN 1: Trích xuất thông tin
Từ văn bản dưới, trích xuất (nếu không tìm được thì để null):
- documentNumber, symbol, issueDate, sender, title, type

PHẦN 2: Tóm tắt
Tóm tắt nội dung trong tối đa 150 ký tự

Trả lời JSON:
{
  "extracted": {
    "documentNumber": "...",
    "symbol": "...",
    "issueDate": "...",
    "sender": "...",
    "title": "...",
    "type": "..."
  },
  "summary": "..."
}

VĂN BẢN:
${rawText}`;

        const response = await axios.post(GEMINI_API.endpoint, {
            contents: [{
                parts: [{
                    text: combinedPrompt
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 600
            }
        }, {
            params: { key: GEMINI_API.key },
            headers: { 'Content-Type': 'application/json' }
        });

        const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('✅ Full Response:');
        console.log(responseText);

        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                console.log('\n✅ PARSED RESULT:');
                console.log(JSON.stringify(result, null, 2));
            }
        } catch (parseErr) {
            console.error('⚠️ Parse error:', parseErr.message);
        }

    } catch (error) {
        console.error('❌ Full Pipeline Error:', error.response?.data || error.message);
    }
}

/**
 * Main
 */
async function main() {
    if (!GEMINI_API.key) {
        console.error('❌ Missing GOOGLE_API_KEY in .env');
        process.exit(1);
    }

    console.log('🧪 Testing Extraction + Summarization');
    console.log('═'.repeat(60));
    console.log(`Gemini Model: ${GEMINI_API.model}`);
    console.log(`Endpoint: ${GEMINI_API.endpoint}\n`);

    // await testExtraction();
    // await testSummarization();
    await testFullPipeline();
}

main().catch(console.error);
