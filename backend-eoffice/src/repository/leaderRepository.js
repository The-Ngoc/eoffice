const { Op, fn, col } = require('sequelize');
const Document = require('../models/documentModel');
const Department = require('../models/departmentModel');
const DocumentFlow = require('../models/documentFlowModel');
const Task = require('../models/taskModel');
const User = require('../models/userModel');
const { DOCUMENT_STATUS } = require('../constants/enums');

function normalizeStatusList(statusList = []) {
    return statusList.map((status) => String(status || '').trim());
}

async function findPendingDocuments() {
    return Document.findAll({
        where: {
            status: {
                [Op.in]: [DOCUMENT_STATUS.PENDING_LEADER, DOCUMENT_STATUS.APPROVED]
            }
        },
        order: [['updatedAt', 'DESC']]
    });
}

async function findDocumentById(id) {
    return Document.findByPk(id);
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

async function assignDepartmentToDocument(docId, deptId) {
    const [document, department] = await Promise.all([
        Document.findByPk(docId),
        Department.findByPk(deptId)
    ]);

    if (!document || !department) {
        return null;
    }

    await document.update({
        assignedDepartmentId: department.id,
        status: DOCUMENT_STATUS.ASSIGNED
    });

    return {
        document: await document.reload(),
        department
    };
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

async function getDeptPerformance() {
    const departments = await Department.findAll({
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
    });

    const counts = await Document.findAll({
        attributes: [
            'assignedDepartmentId',
            [fn('COUNT', col('id')), 'value']
        ],
        group: ['assignedDepartmentId'],
        raw: true
    });

    const countMap = new Map();
    counts.forEach((row) => {
        countMap.set(row.assignedDepartmentId || row.assigned_department_id || '', Number(row.value) || 0);
    });

    return departments.map((department) => ({
        name: department.name,
        value: countMap.get(department.id) || 0
    }));
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

async function appendFlowStep(documentId, step) {
    const document = await Document.findByPk(documentId);
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

async function findManagerAssignedTask(documentId, managerId) {
    if (!managerId) {
        return null;
    }

    return Task.findOne({
        where: {
            documentId,
            assigneeId: managerId,
            parentId: null
        }
    });
}

async function createManagerAssignedTask(payload) {
    return Task.create(payload);
}

async function findUserById(userId) {
    if (!userId) {
        return null;
    }

    return User.findByPk(userId);
}

module.exports = {
    findPendingDocuments,
    findDocumentById,
    updateDocumentStatus,
    assignDepartmentToDocument,
    findDepartments,
    findDepartmentById,
    countDocuments,
    countDocumentsByStatus,
    getDeptPerformance,
    findDocumentsByStatus,
    appendFlowStep,
    createFlowHistory,
    findManagerAssignedTask,
    createManagerAssignedTask,
    findUserById
};