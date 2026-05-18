const Document = require('../models/documentModel');
const DocumentFile = require('../models/documentFileModel');
const DocumentFlow = require('../models/documentFlowModel');
const { DOCUMENT_STATUS } = require('../constants/enums');

async function findAllDocuments() {
    return Document.findAll({
        include: [
            {
                model: DocumentFile,
                as: 'files',
                attributes: ['id', 'nameFile', 'url']
            }
        ],
        order: [['updatedAt', 'DESC']]
    });
}

async function findDocumentById(id) {
    return Document.findByPk(id, {
        include: [
            {
                model: DocumentFile,
                as: 'files',
                attributes: ['id', 'nameFile', 'url']
            },
            {
                model: DocumentFlow,
                as: 'flowHistories',
                attributes: ['id', 'documentId', 'departmentId', 'status', 'action', 'processedAt', 'note'],
                order: [['processedAt', 'DESC']]
            }
        ]
    });
}

async function createDocument(payload, options = {}) {
    // Tạo document mới, hỗ trợ transaction option để đảm bảo tính toàn vẹn dữ liệu
    return Document.create(payload, options);
}

async function updateDocumentById(id, payload, options = {}) {
    const document = await Document.findByPk(id, { transaction: options.transaction });
    if (!document) {
        return null;
    }
    return document.update(payload, options);
}

async function deleteDocumentById(id, options = {}) {
    return Document.destroy({
        where: { id },
        transaction: options.transaction
    });
}

async function countDocumentsByStatus() {
    const statuses = await Document.findAll({
        attributes: [
            'status',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['status'],
        raw: true
    });

    const counts = {
        [DOCUMENT_STATUS.DRAFT]: 0,
        [DOCUMENT_STATUS.PENDING_LEADER]: 0,
        [DOCUMENT_STATUS.APPROVED]: 0,
        [DOCUMENT_STATUS.ASSIGNED]: 0,
        [DOCUMENT_STATUS.PROCESSING]: 0,
        [DOCUMENT_STATUS.COMPLETED]: 0,
        [DOCUMENT_STATUS.REJECTED]: 0,
        total: 0
    };

    statuses.forEach(item => {
        const status = item.status;
        if (counts[status] !== undefined) {
            counts[status] = parseInt(item.count, 10);
        }
    });

    counts.total = Object.values(counts).slice(0, -1).reduce((a, b) => a + b, 0);

    return counts;
}

async function createFlowHistory(payload, options = {}) {
    return DocumentFlow.create(payload, options);
}

// Thêm file đính kèm vào document, hỗ trợ transaction option để đảm bảo tính toàn vẹn dữ liệu
async function addDocumentFile(documentId, fileName, url, options = {}) {
    return DocumentFile.create({
        documentId,
        nameFile: fileName,
        url
    }, options);
}

async function deleteDocumentFile(fileId) {
    return DocumentFile.destroy({
        where: { id: fileId }
    });
}

async function getDocumentFiles(documentId) {
    return DocumentFile.findAll({
        where: { documentId },
        attributes: ['id', 'nameFile', 'url'],
        order: [['createdAt', 'DESC']]
    });
}

module.exports = {
    findAllDocuments,
    findDocumentById,
    createDocument,
    updateDocumentById,
    deleteDocumentById,
    countDocumentsByStatus,
    createFlowHistory,
    addDocumentFile,
    deleteDocumentFile,
    getDocumentFiles
};