const { randomUUID } = require('crypto');
const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const documentRepository = require('../repository/documentRepository');
const cloudinaryService = require('./cloudinaryService');
const { DOCUMENT_STATUS } = require('../constants/enums');
const db = require('../models');
const sequelize = db.sequelize;

function loadPdfLib() {
    try {
        return require('pdf-lib');
    } catch (error) {
        throw createServiceError('Chưa cài thư viện pdf-lib. Vui lòng chạy npm install trong backend-eoffice rồi thử lại.', 500);
    }
}

function loadFontkit() {
    try {
        return require('@pdf-lib/fontkit');
    } catch (error) {
        return null;
    }
}

// Map old status names to new enum for backward compatibility
const LEGACY_STATUS_MAP = {
    initialized: DOCUMENT_STATUS.DRAFT,
    draft: DOCUMENT_STATUS.DRAFT,
    pending: DOCUMENT_STATUS.PENDING_LEADER,
    waiting_leader: DOCUMENT_STATUS.PENDING_LEADER,
    pending_leader: DOCUMENT_STATUS.PENDING_LEADER,
    wailting_leader: DOCUMENT_STATUS.PENDING_LEADER,
    processing: DOCUMENT_STATUS.PROCESSING,
    completed: DOCUMENT_STATUS.COMPLETED,
    rejected: DOCUMENT_STATUS.REJECTED,
    urgent: DOCUMENT_STATUS.PENDING_LEADER
};

function normalizeStatus(value, fallback = DOCUMENT_STATUS.DRAFT) {
    if (!value) return fallback;
    const str = String(value || '').trim();

    // If value already matches one of DOCUMENT_STATUS values (case-insensitive), return that enum value
    const upper = str.toUpperCase();
    const matched = Object.values(DOCUMENT_STATUS).find(v => String(v).toUpperCase() === upper);
    if (matched) return matched;

    // Otherwise try legacy mapping by lowercased keys
    const key = str.toLowerCase();
    return LEGACY_STATUS_MAP[key] || fallback;
}

function createNotFoundError(message) {
    const error = new Error(message);
    error.statusCode = 404;
    return error;
}

function createValidationError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function createServiceError(message, statusCode = 500, details = null) {
    const error = new Error(message);
    error.statusCode = statusCode;
    if (details) {
        error.details = details;
    }
    return error;
}

function normalizeJsonArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [value];
        } catch (error) {
            return [value];
        }
    }

    return [];
}

function buildDocumentResponse(doc) {
    if (!doc) return null;
    const plain = doc.get ? doc.get({ plain: true }) : doc;
    
    // Include associated files and flow history if available
    const response = {
        id: plain.id,
        documentNumber: plain.documentNumber,
        symbol: plain.symbol,
        title: plain.title,
        sender: plain.sender,
        status: plain.status,
        urgency: plain.urgency,
        priority: plain.priority || null,
        type: plain.type,
        description: plain.description || null,
        summary: plain.summary || null,
        legalWarning: Boolean(plain.legalWarning),
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt
    };

    // Include files if present in response
    if (plain.files && Array.isArray(plain.files)) {
        response.files = plain.files.map(f => ({
            id: f.id,
            nameFile: f.nameFile,
            url: f.url
        }));
    }

    // Include flow history if present
    if (plain.flowHistories && Array.isArray(plain.flowHistories)) {
        response.flowHistories = plain.flowHistories.map(f => ({
            id: f.id,
            departmentId: f.departmentId,
            userId: f.userId,
            status: f.status,
            action: f.action,
            processedAt: f.processedAt,
            note: f.note
        }));
    }

    return response;
}

async function getAllDocuments() {
    const documents = await documentRepository.findAllDocuments();
    return documents.map(buildDocumentResponse);
}

async function getDocumentById(id) {
    const document = await documentRepository.findDocumentById(id);
    if (!document) {
        throw createNotFoundError('Văn bản không tồn tại');
    }
    return buildDocumentResponse(document);
}

async function createDocument(payload, files = []) {
    const errors = [];

    const requiredFields = ['title', 'sender', 'urgency', 'type'];
    requiredFields.forEach(field => {
        if (!payload[field]) {
            errors.push(`${field} là bắt buộc`);
        }
    });

    const normalizedStatus = normalizeStatus(payload.status, DOCUMENT_STATUS.DRAFT);
    if (!Object.values(DOCUMENT_STATUS).includes(normalizedStatus)) {
        errors.push('status không hợp lệ');
    }

    if (errors.length > 0) {
        throw createValidationError(errors.join(', '));
    }

    // Bắt đầu Transaction để đảm bảo tính toàn vẹn dữ liệu
    const transaction = await sequelize.transaction();

    try {
        // Hàm chuyển đổi legalWarning thành boolean
        const normalizeLegalWarning = (value) => {
            if (value === null || value === undefined) return false;
            if (typeof value === 'boolean') return value;
            if (typeof value === 'string') {
                const lowercased = String(value).toLowerCase().trim();
                return lowercased === 'true' || lowercased === '1' || lowercased === 'yes';
            }
            if (typeof value === 'number') return value === 1 || value === true;
            return false;
        };

        // Chuẩn bị payload cho document
        const normalizedPayload = {
            id: payload.id || randomUUID(),
            // documentNumber: nếu không có thì backend tự tạo (không bắt buộc từ request)
            documentNumber: payload.documentNumber || payload.docNumber || `DOC-${Date.now()}`,
            symbol: payload.symbol || '',
            title: payload.title.trim(),
            sender: payload.sender.trim(),
            // status: nếu không có thì mặc định là DRAFT (không bắt buộc từ request)
            status: normalizedStatus,
            urgency: payload.urgency,
            priority: payload.priority || null,
            type: payload.type.trim(),
            description: payload.description || null,
            summary: payload.summary || null,
            // legalWarning: boolean - true = có cảnh báo pháp lý, false = không
            legalWarning: normalizeLegalWarning(payload.legalWarning)
        };

        // Tạo document mới trong database
        const created = await documentRepository.createDocument(normalizedPayload, { transaction });

        // Ghi nhận luồng khởi tạo document ngay sau khi tạo thành công
        await documentRepository.createFlowHistory({
            documentId: created.id,
            status: 'CREATE',
            action: 'CREATED',
            note: 'Document created',
            processedAt: new Date()
        }, { transaction });

        // Xử lý files nếu có
        let uploadedFiles = [];
        if (files && files.length > 0) {
            try {
                // Upload tất cả files lên Cloudinary đồng thời bằng Promise.all() để tối ưu thời gian
                const uploadPromises = files.map(file => {
                    const fileName = `${normalizedPayload.id}_${Date.now()}_${file.originalname}`;
                    return cloudinaryService.uploadBufferToCloudinary(
                        file.buffer,
                        fileName,
                        {
                            contentType: file.mimetype,
                            folder: undefined
                        }
                    );
                });

                // Chờ tất cả uploads hoàn thành
                const cloudinaryResults = await Promise.all(uploadPromises);

                // Tách URL từ response của Cloudinary và insert vào database
                const fileInsertPromises = cloudinaryResults.map((result, index) => {
                    if (result.success && (result.secureUrl || result.url)) {
                        // Trích xuất URL: ưu tiên secureUrl (HTTPS), nếu không có thì dùng url (HTTP)
                        const fileUrl = result.secureUrl || result.url;
                        const fileName = files[index].originalname || result.originalFilename;

                        // Insert thông tin file vào database với transaction
                        return documentRepository.addDocumentFile(
                            created.id,
                            fileName,
                            fileUrl,
                            { transaction }
                        );
                    } else {
                        // Nếu upload không thành công, throw error
                        throw createServiceError(
                            `Upload file "${files[index].originalname}" thất bại`,
                            500
                        );
                    }
                });

                // Chờ tất cả file inserts hoàn thành
                uploadedFiles = await Promise.all(fileInsertPromises);
            } catch (fileError) {
                // Đẩy lỗi ra để try-catch bên ngoài lo việc rollback
                console.error('❌ Lỗi khi xử lý files:', fileError);
                throw createServiceError(
                    `Lỗi xử lý files: ${fileError.message}`,
                    fileError.statusCode || 500
                );
            }
        }

        // Commit transaction nếu mọi thứ thành công
        await transaction.commit();

        // Lấy document vừa tạo cùng files để trả về
        const updatedDocument = await documentRepository.findDocumentById(created.id);
        return buildDocumentResponse(updatedDocument);
    } catch (error) {
        // Rollback transaction nếu có lỗi
        if (!transaction.finished) {
            await transaction.rollback();
        }
        throw error;
    }
}

async function updateDocumentApprove(payload) {
    if (!payload.id || !payload.status) {
        throw createValidationError('id và status là bắt buộc');
    }

    const nextStatus = normalizeStatus(payload.status);
    if (!Object.values(DOCUMENT_STATUS).includes(nextStatus)) {
        throw createValidationError('status không hợp lệ');
    }

    if (nextStatus === DOCUMENT_STATUS.PUBLISHED) {
        throw createValidationError('Vui lòng dùng chức năng đóng dấu PDF để ban hành văn bản');
    }

    const existing = await documentRepository.findDocumentById(payload.id);
    if (!existing) {
        throw createNotFoundError('Văn bản không tồn tại');
    }

    const updated = await documentRepository.updateDocumentById(payload.id, {
        status: nextStatus
    });

    console.log(`Document ${payload.id} status updated to ${nextStatus}`);

    // Create flow history record
    await documentRepository.createFlowHistory({
        documentId: payload.id,
        action: 'APPROVE',
        status: nextStatus,
        note: payload.note || null,
        processedAt: new Date(),
        userId: payload.userId || null,
        departmentId: payload.departmentId || null
    });

    return buildDocumentResponse(updated);
}

async function submitDocumentToLeader(payload, actor = {}) {
    const id = payload?.id;
    if (!id) {
        throw createValidationError('id là bắt buộc');
    }

    const document = await documentRepository.findDocumentById(id);
    if (!document) {
        throw createNotFoundError('Văn bản không tồn tại');
    }

    const currentStatus = document.status;
    const submitAllowed = new Set([DOCUMENT_STATUS.DRAFT, DOCUMENT_STATUS.REJECTED]);

    if (!submitAllowed.has(currentStatus)) {
        if (currentStatus === DOCUMENT_STATUS.PENDING_LEADER) {
            throw createValidationError('Văn bản đã được trình lãnh đạo');
        }

        throw createValidationError('Chỉ văn bản ở trạng thái khởi tạo hoặc bị từ chối mới được trình lãnh đạo');
    }

    const nextStatus = DOCUMENT_STATUS.PENDING_LEADER;
    
    // Sử dụng Database Transaction để đảm bảo tính toàn vẹn khi vừa update DB vừa create lịch sử
    const transaction = await sequelize.transaction();

    try {
        await documentRepository.updateDocumentById(id, {
            status: nextStatus
        }, { transaction });
        
        await documentRepository.createFlowHistory({
            documentId: id,
            departmentId: actor.departmentId || payload.departmentId || null,
            userId: actor.id || payload.userId || null,
            status: nextStatus,
            action: 'SUBMIT_TO_LEADER',
            note: payload.note || null,
            processedAt: new Date()
        }, { transaction });

        await transaction.commit();
        
        const updated = await documentRepository.findDocumentById(id);
        return buildDocumentResponse(updated);
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        throw createServiceError(`Lỗi khi trình lãnh đạo: ${error.message}`, error.statusCode || 500);
    }
}

async function deleteDocument(id) {
    if (!id) {
        throw createValidationError('id là bắt buộc');
    }

    const existing = await documentRepository.findDocumentById(id);
    if (!existing) {
        throw createNotFoundError('Văn bản không tồn tại');
    }

    await documentRepository.deleteDocumentById(id);
    return { id, deleted: true };
}

async function getDocumentStats() {
    return documentRepository.countDocumentsByStatus();
}

async function getDocumentFiles(documentId) {
    if (!documentId) {
        throw createValidationError('id của văn bản là bắt buộc');
    }
    
    // Kiểm tra văn bản có tồn tại không
    const document = await documentRepository.findDocumentById(documentId);
    if (!document) {
        throw createNotFoundError('Văn bản không tồn tại');
    }

    const files = await documentRepository.getDocumentFiles(documentId);
    
    // Map data theo yêu cầu format của client
    return files.map((file) => ({
        id: file.id,
        file_name: file.nameFile,
        file_url: file.url
    }));
}

function formatSealDate(date = new Date()) {
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh'
    });
}

function buildVietnamesePublishLine(date = new Date()) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `Đà Nẵng, ngày ${day} tháng ${month} năm ${year}`;
}

async function embedPdfFonts(pdfDoc, StandardFonts) {
    const fontkit = loadFontkit();
    const fontCandidates = [
        process.env.PDF_FONT_REGULAR,
        'C:\\Windows\\Fonts\\arial.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    ].filter(Boolean);

    if (fontkit) {
        pdfDoc.registerFontkit(fontkit);

        for (const fontPath of fontCandidates) {
            try {
                const fontBytes = await fs.readFile(fontPath);
                const regularFont = await pdfDoc.embedFont(fontBytes);
                const boldPath = String(fontPath).replace(/arial\.ttf$/i, 'arialbd.ttf');
                let boldFont = regularFont;

                try {
                    const boldBytes = await fs.readFile(process.env.PDF_FONT_BOLD || boldPath);
                    boldFont = await pdfDoc.embedFont(boldBytes);
                } catch (error) {
                    boldFont = regularFont;
                }

                return {
                    regularFont,
                    boldFont,
                    supportsVietnamese: true
                };
            } catch (error) {
                // Try next font candidate.
            }
        }
    }

    return {
        regularFont: await pdfDoc.embedFont(StandardFonts.Helvetica),
        boldFont: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        supportsVietnamese: false
    };
}

async function saveSealedPdfLocally(fileName, pdfBuffer) {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'sealed');
    await fs.mkdir(uploadDir, { recursive: true });

    const safeFileName = String(fileName || `sealed_${Date.now()}.pdf`).replace(/[^\w.-]/g, '_');
    const filePath = path.join(uploadDir, safeFileName);
    await fs.writeFile(filePath, pdfBuffer);

    const baseUrl = String(process.env.PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    return {
        fileName: safeFileName,
        url: `${baseUrl}/uploads/sealed/${encodeURIComponent(safeFileName)}`
    };
}

function safePdfText(value, fallback = '') {
    return String(value || fallback)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim();
}

async function createSealPdf(document, sourceFile) {
    const { PDFDocument, StandardFonts, rgb } = loadPdfLib();
    let pdfDoc;
    let generatedContentBottomY = null;

    if (sourceFile?.url && String(sourceFile.url).toLowerCase().includes('.pdf')) {
        try {
            const response = await axios.get(sourceFile.url, {
                responseType: 'arraybuffer',
                timeout: 20000,
                maxContentLength: 20 * 1024 * 1024
            });
            pdfDoc = await PDFDocument.load(response.data, { ignoreEncryption: true });
        } catch (error) {
            console.warn('Không thể tải PDF gốc để đóng dấu, tạo bản PDF ban hành mới:', error.message);
        }
    }

    if (!pdfDoc) {
        pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]);
        const { regularFont: font, boldFont } = await embedPdfFonts(pdfDoc, StandardFonts);

        page.drawText('eOffice - VAN BAN BAN HANH', {
            x: 54,
            y: 780,
            size: 16,
            font: boldFont,
            color: rgb(0.18, 0.18, 0.18)
        });
        page.drawText(`So van ban: ${safePdfText(document.documentNumber, document.id)}`, {
            x: 54,
            y: 740,
            size: 11,
            font,
            color: rgb(0.25, 0.25, 0.25)
        });
        page.drawText(`Ky hieu: ${safePdfText(document.symbol, '--')}`, {
            x: 54,
            y: 720,
            size: 11,
            font,
            color: rgb(0.25, 0.25, 0.25)
        });
        page.drawText(`Tieu de: ${safePdfText(document.title, 'Khong co tieu de').slice(0, 90)}`, {
            x: 54,
            y: 700,
            size: 11,
            font,
            color: rgb(0.25, 0.25, 0.25)
        });
        page.drawText(safePdfText(document.summary || document.description || 'Noi dung duoc luu tren he thong eOffice.').slice(0, 100), {
            x: 54,
            y: 665,
            size: 10,
            font,
            color: rgb(0.35, 0.35, 0.35)
        });
        generatedContentBottomY = 665;
    }

    const pages = pdfDoc.getPages();
    const targetPage = pages[pages.length - 1] || pdfDoc.addPage([595.28, 841.89]);
    const { width } = targetPage.getSize();
    const { regularFont: font, boldFont, supportsVietnamese } = await embedPdfFonts(pdfDoc, StandardFonts);
    const red = rgb(0.78, 0.05, 0.05);
    const sealDate = formatSealDate();
    const publishLine = supportsVietnamese ? buildVietnamesePublishLine() : safePdfText(buildVietnamesePublishLine());
    const centerX = Math.max(120, width - 145);
    const dateY = generatedContentBottomY ? Math.max(140, generatedContentBottomY - 42) : 172;
    const centerY = Math.max(82, dateY - 58);
    const dateTextWidth = font.widthOfTextAtSize(publishLine, 10);

    targetPage.drawText(publishLine, {
        x: Math.max(54, centerX - dateTextWidth / 2),
        y: dateY,
        size: 10,
        font,
        color: rgb(0.08, 0.08, 0.08)
    });

    targetPage.drawEllipse({
        x: centerX,
        y: centerY,
        xScale: 66,
        yScale: 42,
        borderColor: red,
        borderWidth: 2.2,
        opacity: 0.92
    });
    targetPage.drawEllipse({
        x: centerX,
        y: centerY,
        xScale: 56,
        yScale: 32,
        borderColor: red,
        borderWidth: 1,
        opacity: 0.92
    });
    targetPage.drawText('eOFFICE', {
        x: centerX - 28,
        y: centerY + 15,
        size: 10,
        font: boldFont,
        color: red
    });
    targetPage.drawText('DA BAN HANH', {
        x: centerX - 43,
        y: centerY - 2,
        size: 10,
        font: boldFont,
        color: red
    });
    targetPage.drawText(sealDate, {
        x: centerX - 29,
        y: centerY - 18,
        size: 9,
        font,
        color: red
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}

async function sealDocument(documentId, actor = {}) {
    if (!documentId) {
        throw createValidationError('id của văn bản là bắt buộc');
    }

    const document = await documentRepository.findDocumentById(documentId);
    if (!document) {
        throw createNotFoundError('Văn bản không tồn tại');
    }

    const plain = document.get ? document.get({ plain: true }) : document;
    const files = await documentRepository.getDocumentFiles(documentId);
    const sourceFile = files.find((file) => String(file.nameFile || '').toLowerCase().endsWith('.pdf')) || files[0] || null;
    const sealedBuffer = await createSealPdf(plain, sourceFile);
    const safeNumber = safePdfText(plain.documentNumber || plain.id, 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sealedFileName = `sealed_${safeNumber}_${Date.now()}.pdf`;
    const localFile = await saveSealedPdfLocally(sealedFileName, sealedBuffer);
    let deliveryUrl = localFile.url;

    try {
        const result = await cloudinaryService.uploadBufferToCloudinary(sealedBuffer, sealedFileName, {
            contentType: 'application/pdf',
            folder: 'sealed-documents'
        });

        if (result.success && (result.secureUrl || result.url)) {
            deliveryUrl = localFile.url;
        }
    } catch (error) {
        console.warn('Không thể upload PDF đóng dấu lên Cloudinary, dùng file local:', error.message);
    }

    const transaction = await sequelize.transaction();
    try {
        const sealedFile = await documentRepository.addDocumentFile(
            documentId,
            localFile.fileName,
            deliveryUrl,
            { transaction }
        );

        await documentRepository.updateDocumentById(documentId, {
            status: DOCUMENT_STATUS.PUBLISHED
        }, { transaction });

        await documentRepository.createFlowHistory({
            documentId,
            userId: actor.id || null,
            departmentId: actor.departmentId || null,
            status: DOCUMENT_STATUS.PUBLISHED,
            action: 'SEALED_AND_PUBLISHED',
            note: `Đã đóng dấu điện tử ngày ${formatSealDate()}`,
            processedAt: new Date()
        }, { transaction });

        await transaction.commit();

        const updated = await documentRepository.findDocumentById(documentId);
        return {
            document: buildDocumentResponse(updated),
            sealedFile: {
                id: sealedFile.id,
                file_name: sealedFile.nameFile,
                file_url: sealedFile.url
            }
        };
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        throw error;
    }
}

async function getDocumentFlowHistory(documentId) {
    if (!documentId) {
        throw createValidationError('documentId là bắt buộc');
    }

    const document = await documentRepository.findDocumentById(documentId);
    if (!document) {
        throw createNotFoundError('Văn bản không tồn tại');
    }

    const flowHistory = await documentRepository.getDocumentFlowHistory(documentId);

    return {
        id: document.id,
        document_id: document.id,
        flow_history: flowHistory.map((item) => ({
            id: item.id,
            document_id: item.documentId,
            department_id: item.departmentId,
            status: item.status,
            action: item.action,
            note: item.note,
            processed_at: item.processedAt,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        }))
    };
}
    
    // getDocumentFiles,
    // getDocumentFlowHistory

module.exports = {
    getAllDocuments,
    getDocumentById,
    createDocument,
    updateDocumentApprove,
    submitDocumentToLeader,
    deleteDocument,
    getDocumentStats,
    getDocumentFiles,
    sealDocument
};
