/**
 * Parser Service - Regex & Rule-based Extraction
 * Trích xuất các field cấu trúc từ raw text bằng regex (không dùng AI)
 * Pattern được tối ưu cho tài liệu hành chính Việt Nam
 */

/**
 * Normalize text: loại bỏ khoảng trắng dư thừa, fix line breaks
 */
function normalizeText(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';

    return rawText
        .replace(/\r\n/g, '\n')           // Chuẩn hóa line breaks
        .replace(/\s+$/gm, '')             // Remove trailing spaces
        .replace(/^\s+/gm, '')             // Remove leading spaces
        .trim();
}

/**
 * Extract Document Number (Số ký hiệu)
 * Pattern: Số: 1725/KH-ĐHL
 */
function extractDocumentNumber(text) {
    // Pattern 1: "Số: 1725/KH-ĐHL"
    let match = text.match(/Số\s*:\s*([0-9]+\/[A-Z0-9\-]+)/i);
    if (match && match[1]) return match[1].trim();

    // Pattern 2: "Số: 1725/KH-ĐHL" (không có dấu hai chấm)
    match = text.match(/Số\s+([0-9]+\/[A-Z0-9\-]+)/i);
    if (match && match[1]) return match[1].trim();

    return null;
}

/**
 * Extract Symbol (Ký hiệu đơn vị)
 * Từ documentNumber, lấy phần sau dấu "/"
 * Ví dụ: "1725/KH-ĐHL" → "KH-ĐHL"
 */
function extractSymbol(documentNumber) {
    if (!documentNumber) return null;

    const parts = documentNumber.split('/');
    return parts.length > 1 ? parts[1].trim() : null;
}

/**
 * Extract Issue Date (Ngày tháng năm)
 * Pattern: "Thành phố Hồ Chí Minh, ngày 02 tháng 12 năm 2025"
 * Format output: "2025-12-02" (YYYY-MM-DD)
 */
function extractIssueDate(text) {
    // Pattern: "ngày 02 tháng 12 năm 2025"
    const match = text.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i);

    if (match && match[3] && match[2] && match[1]) {
        const year = match[3];
        const month = String(match[2]).padStart(2, '0');
        const day = String(match[1]).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    return null;
}

/**
 * Extract Sender (Đơn vị/Bộ phát hành)
 * Thường ở dòng đầu tiên: "BỘ GIÁO DỤC VÀ ĐÀO TẠO TRƯỜNG ĐẠI HỌC LUẬT TP. HCM"
 * Pattern: Dòng bắt đầu với (BỘ|UBND|TRƯỜNG|SỞ|CÔNG TY|NGÂN HÀNG)
 */
function extractSender(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Scan dòng đầu (có thể là sender)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i];
        
        // Patterns for Vietnamese government/organizational entities
        if (/^(BỘ|UBND|TRƯỜNG|SỞ|CÔNG TY|NGÂN HÀNG|HỘI|CỘNG ĐOÀN|CHỈ HUY)/i.test(line)) {
            return line;
        }
    }

    return null;
}

/**
 * Extract Title (Tiêu đề chính)
 * Thường là dòng viết hoa, nằm giữa 20%-80% của tài liệu
 * Patterns: "KẾ HOẠCH", "QUYẾT ĐỊNH", "CÔNG VĂN", "BÁO CÁO"
 */
function extractTitle(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const totalLines = lines.length;

    // Scope: từ 20% đến 80% độ dài document
    const startIdx = Math.max(0, Math.floor(totalLines * 0.2));
    const endIdx = Math.min(totalLines, Math.floor(totalLines * 0.8));

    // Tìm dòng viết HOA (uppercase ratio >= 80%)
    for (let i = startIdx; i < endIdx; i++) {
        const line = lines[i];

        if (!line || line.length < 5) continue;

        // Tính tỷ lệ chữ cái viết hoa
        const letters = line.match(/[A-ZÀ-ỰẦ-ỰĂ-ẴÂ-ẶÊ-ỂÔ-ỖƠ-ỚƯ-Ự]/g) || [];
        const ratio = letters.length / line.length;

        if (ratio >= 0.8) {
            return line;
        }
    }

    return null;
}

/**
 * Detect Document Type từ tiêu đề
 * Pattern matching: "KẾ HOẠCH" → "Kế hoạch", "QUYẾT ĐỊNH" → "Quyết định", etc.
 */
function detectType(title) {
    if (!title) return null;

    const titleUpper = title.toUpperCase();

    // Mapping keywords to types
    const typeMap = [
        { keywords: ['KẾ HOẠCH'], type: 'Kế hoạch' },
        { keywords: ['QUYẾT ĐỊNH'], type: 'Quyết định' },
        { keywords: ['CÔNG VĂN', 'CÔNG ĐIỆN'], type: 'Công văn' },
        { keywords: ['BÁO CÁO'], type: 'Báo cáo' },
        { keywords: ['THÔNG TƯ', 'HƯỚNG DẪN'], type: 'Thông tư' },
        { keywords: ['CHỈ THỊ'], type: 'Chỉ thị' },
        { keywords: ['QUYẾT SÁC', 'QUYẾT SÁCH'], type: 'Quyết sách' },
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

/**
 * Parse toàn bộ document
 * Orchestrate tất cả extractors
 */
function parseDocument(rawText) {
    try {
        const normalized = normalizeText(rawText);

        const documentNumber = extractDocumentNumber(normalized);
        const symbol = extractSymbol(documentNumber);
        const issueDate = extractIssueDate(normalized);
        const sender = extractSender(normalized);
        const title = extractTitle(normalized);
        const type = detectType(title);

        console.log('📋 Parser Result:');
        console.log(`  documentNumber: ${documentNumber || 'null'}`);
        console.log(`  symbol: ${symbol || 'null'}`);
        console.log(`  issueDate: ${issueDate || 'null'}`);
        console.log(`  sender: ${sender ? sender.substring(0, 40) + '...' : 'null'}`);
        console.log(`  title: ${title ? title.substring(0, 40) + '...' : 'null'}`);
        console.log(`  type: ${type || 'null'}`);

        return {
            documentNumber,
            symbol,
            issueDate,
            sender,
            title,
            type
        };

    } catch (error) {
        console.error('❌ Parser error:', error.message);
        throw error;
    }
}

module.exports = {
    normalizeText,
    extractDocumentNumber,
    extractSymbol,
    extractIssueDate,
    extractSender,
    extractTitle,
    detectType,
    parseDocument
};
