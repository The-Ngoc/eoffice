const { randomUUID } = require('crypto');
const documentRepository = require('../repository/documentRepository');
const cloudinaryService = require('./cloudinaryService');
const { DOCUMENT_STATUS } = require('../constants/enums');
const db = require('../models');
const sequelize = db.sequelize;

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
    const key = String(value || '').trim().toLowerCase();
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
    // Kiểm tra các trường bắt buộc
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

async function updateDocumentStatus(payload) {
    if (!payload.id || !payload.status) {
        throw createValidationError('id và status là bắt buộc');
    }

    const nextStatus = normalizeStatus(payload.status);
    if (!Object.values(DOCUMENT_STATUS).includes(nextStatus)) {
        throw createValidationError('status không hợp lệ');
    }

    const existing = await documentRepository.findDocumentById(payload.id);
    if (!existing) {
        throw createNotFoundError('Văn bản không tồn tại');
    }

    const updated = await documentRepository.updateDocumentById(payload.id, {
        status: nextStatus
    });

    // Create flow history record
    await documentRepository.createFlowHistory({
        documentId: payload.id,
        action: 'STATUS_UPDATED',
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

module.exports = {
    getAllDocuments,
    getDocumentById,
    createDocument,
    updateDocumentStatus,
    submitDocumentToLeader,
    deleteDocument,
    getDocumentStats
};