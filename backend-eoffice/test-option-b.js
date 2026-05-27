/**
 * Test extraction + summarization (Phương án B)
 * Mô phỏng: Azure OCR → Raw text → Regex Parse + Gemini Summary
 */

const fs = require('fs');
const axios = require('axios');

const GEMINI_API = {
    endpoint: process.env.GOOGLE_GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    key: process.env.GOOGLE_API_KEY,
    model: process.env.GOOGLE_GEMINI_MODEL || 'gemini-1.5-flash'
};

// ===== REGEX EXTRACTION FUNCTIONS =====

function extractDocumentNumber(text) {
    let match = text.match(/Số\s*:\s*([0-9]+\/[A-Z0-9\-]+)/i);
    if (match && match[1]) return match[1].trim();
    match = text.match(/Số\s+([0-9]+\/[A-Z0-9\-]+)/i);
    if (match && match[1]) return match[1].trim();
    return null;
}

function extractSymbol(documentNumber) {
    if (!documentNumber) return null;
    const parts = documentNumber.split('/');
    return parts.length > 1 ? parts[1].trim() : null;
}

function extractIssueDate(text) {
    const match = text.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i);
    if (match && match[3] && match[2] && match[1]) {
        const year = match[3];
        const month = String(match[2]).padStart(2, '0');
        const day = String(match[1]).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return null;
}

function extractSender(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i];
        if (/^(BỘ|UBND|TRƯỜNG|SỞ|CÔNG TY|NGÂN HÀNG|HỘI|CỘNG ĐOÀN|CHỈ HUY)/i.test(line)) {
            return line;
        }
    }
    return null;
}

function extractTitle(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const totalLines = lines.length;
    const startIdx = Math.max(0, Math.floor(totalLines * 0.2));
    const endIdx = Math.min(totalLines, Math.floor(totalLines * 0.8));

    for (let i = startIdx; i < endIdx; i++) {
        const line = lines[i];
        if (!line || line.length < 5) continue;

        const letters = line.match(/[A-ZÀ-ỰẦ-ỰĂ-ẴÂ-ẶÊ-ỂÔ-ỖƠ-ỚƯ-Ự]/g) || [];
        const ratio = letters.length / line.length;

        if (ratio >= 0.8) {
            return line;
        }
    }
    return null;
}

function detectType(title) {
    if (!title) return null;
    const titleUpper = title.toUpperCase();

    const typeMap = [
        { keywords: ['KẾ HOẠCH'], type: 'Kế hoạch' },
        { keywords: ['QUYẾT ĐỊNH'], type: 'Quyết định' },
        { keywords: ['CÔNG VĂN', 'CÔNG ĐIỆN'], type: 'Công văn' },
        { keywords: ['BÁO CÁO'], type: 'Báo cáo' },
        { keywords: ['THÔNG TƯ', 'HƯỚNG DẪN'], type: 'Thông tư' },
        { keywords: ['CHỈ THỊ'], type: 'Chỉ thị' },
        { keywords: ['HỢP ĐỒNG'], type: 'Hợp đồng' },
        { keywords: ['BIÊN BẢN'], type: 'Biên bản' },
        { keywords: ['ĐỀ ÁN'], type: 'Đề án' }
    ];

    for (const { keywords, type } of typeMap) {
        for (const keyword of keywords) {
            if (titleUpper.includes(keyword)) {
                return type;
            }
        }
    }
    return 'Tài liệu khác';
}

// ===== TEST FUNCTIONS =====

/**
 * Test 1: Regex extraction
 */
function testRegexExtraction() {
    try {
        console.log('\n📋 TEST 1: Regex Extraction');
        console.log('═'.repeat(60));

        const rawText = fs.readFileSync('./test-data.txt', 'utf-8');
        console.log(`📄 Raw text length: ${rawText.length} chars\n`);

        const documentNumber = extractDocumentNumber(rawText);
        const symbol = extractSymbol(documentNumber);
        const issueDate = extractIssueDate(rawText);
        const sender = extractSender(rawText);
        const title = extractTitle(rawText);
        const type = detectType(title);

        const extracted = {
            documentNumber,
            symbol,
            issueDate,
            sender,
            title,
            type
        };

        console.log('✅ REGEX EXTRACTED FIELDS:');
        console.log(JSON.stringify(extracted, null, 2));
        return extracted;

    } catch (error) {
        console.error('❌ Regex extraction error:', error.message);
    }
}

/**
 * Test 2: Gemini summarization
 */
async function testGeminiSummarization() {
    try {
        console.log('\n📝 TEST 2: Gemini Summarization');
        console.log('═'.repeat(60));

        const rawText = fs.readFileSync('./test-data.txt', 'utf-8');

        const prompt = `Bạn là chuyên gia tóm tắt tài liệu hành chính Việt Nam.

Tóm tắt nội dung tài liệu dưới đây trong TỐI ĐA 150 ký tự. 
Hãy viết tóm tắt bằng cách hiểu của bạn, không copy-paste từ văn bản gốc.

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
                maxOutputTokens: 500
            }
        }, {
            params: { key: GEMINI_API.key },
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });

        const summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('✅ Summary:');
        console.log(summary);
        console.log(`\n📊 Length: ${summary.length} characters`);
        return summary;

    } catch (error) {
        console.error('❌ Gemini error:', error.response?.data?.error?.message || error.message);
    }
}

/**
 * Test 3: Full pipeline
 */
async function testFullPipeline() {
    try {
        console.log('\n🚀 TEST 3: Full Pipeline (Regex + Gemini)');
        console.log('═'.repeat(60));

        // Step 1: Regex extraction
        console.log('Step 1: Regex extraction...');
        const extracted = testRegexExtraction();

        // Step 2: Gemini summary
        console.log('\nStep 2: Gemini summary...');
        const summary = await testGeminiSummarization();

        // Step 3: Combine
        console.log('\n✅ FINAL RESULT:');
        const result = {
            ...extracted,
            summary: summary?.trim().substring(0, 150)
        };
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('❌ Full pipeline error:', error.message);
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

    console.log('🧪 Testing Phương án B: Regex + Gemini');
    console.log('═'.repeat(60));
    console.log(`Gemini Model: ${GEMINI_API.model}`);
    console.log(`Endpoint: ${GEMINI_API.endpoint}\n`);

    // Chạy test từng bước
    testRegexExtraction();
    await testGeminiSummarization();
    // Hoặc chạy full pipeline:
    // await testFullPipeline();
}

main().catch(console.error);
