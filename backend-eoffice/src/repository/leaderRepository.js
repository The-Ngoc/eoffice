const { Op, fn, col } = require('sequelize');
const Document = require('../models/documentModel');
const Department = require('../models/departmentModel');
const DocumentFlow = require('../models/documentFlowModel');
const DocumentFile = require('../models/documentFileModel');
const { DOCUMENT_STATUS } = require('../constants/enums');

function normalizeStatusList(statusList = []) {
    return statusList.map((status) => String(status || '').trim());
}

async function findPendingDocuments() {
    return Document.findAll({
        where: {
            status: DOCUMENT_STATUS.PENDING_LEADER
        },
        include: [
            {
                model: DocumentFile,
                as: 'files',
                attributes: ['id', 'nameFile', 'url']
            },
            {
                model: DocumentFlow,
                as: 'flowHistories',
                attributes: ['id', 'documentId', 'departmentId', 'status', 'action', 'processedAt'],
                order: [['processedAt', 'DESC']]
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

async function updateDocumentStatus(id, status, extraFields = {}) {
    const document = await Document.findByPk(id);

    if (!document) {
        return null;
    }

    await document.update({
        status,
        ...extraFields
    });

    return document.reload();
}

async function findDepartments() {
    return Department.findAll({
        order: [['name', 'ASC']]
    });
}

async function findDepartmentById(deptId) {
    return Department.findByPk(deptId);
}

async function countDocuments() {
    return Document.count();
}

async function countDocumentsByStatus(statusList) {
    const normalizedStatuses = normalizeStatusList(statusList);
    return Document.count({
        where: {
            status: {
                [Op.in]: normalizedStatuses
            }
        }
    });
}

async function findDocumentsByStatus(statusList) {
    const normalizedStatuses = normalizeStatusList(statusList);
    return Document.findAll({
        where: {
            status: {
                [Op.in]: normalizedStatuses
            }
        },
        attributes: ['id', 'createdAt', 'updatedAt'],
        raw: true
    });
}

async function createFlowHistory(payload) {
    return DocumentFlow.create(payload);
}

module.exports = {
    findPendingDocuments,
    findDocumentById,
    updateDocumentStatus,
    findDepartments,
    findDepartmentById,
    countDocuments,
    countDocumentsByStatus,
    findDocumentsByStatus,
    createFlowHistory
};