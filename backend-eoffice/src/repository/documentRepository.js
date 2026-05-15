const Document = require('../models/documentModel');
const DocumentFlow = require('../models/documentFlowModel');
const { DOCUMENT_STATUS } = require('../constants/enums');

async function findAllDocuments() {
    return Document.findAll({
        order: [['updatedAt', 'DESC']]
    });
}

async function findDocumentById(id) {
    return Document.findByPk(id);
}

async function createDocument(payload) {
    return Document.create(payload);
}

async function updateDocumentById(id, payload) {
    const document = await Document.findByPk(id);
    if (!document) {
        return null;
    }
    return document.update(payload);
}

async function deleteDocumentById(id) {
    return Document.destroy({
        where: { id }
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

async function appendFlowStep(id, step) {
    const document = await Document.findByPk(id);
    if (!document) {
        return null;
    }

    const flow = Array.isArray(document.flow)
        ? document.flow.map((item) => {
            if (!item || typeof item !== 'object') return item;
            return {
                ...item,
                status: 'Done'
            };
        })
        : [];

    flow.push({
        ...step,
        status: step?.status || 'Current'
    });

    await document.update({ flow });
    return document.reload();
}

async function createFlowHistory(payload) {
    return DocumentFlow.create(payload);
}

module.exports = {
    findAllDocuments,
    findDocumentById,
    createDocument,
    updateDocumentById,
    deleteDocumentById,
    countDocumentsByStatus,
    appendFlowStep,
    createFlowHistory
};