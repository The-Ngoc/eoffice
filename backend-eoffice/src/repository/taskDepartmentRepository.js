const TaskDepartment = require('../models/taskDepartmentModel');
const Document = require('../models/documentModel');
const DocumentFile = require('../models/documentFileModel');
const Department = require('../models/departmentModel');

function buildDocumentInclude() {
    return {
        model: Document,
        as: 'document',
        attributes: [
            'id',
            'documentNumber',
            'symbol',
            'title',
            'sender',
            'status',
            'urgency',
            'priority',
            'type',
            'description',
            'summary',
            'legalWarning',
            'createdAt',
            'updatedAt'
        ],
        include: [
            {
                model: DocumentFile,
                as: 'files',
                attributes: ['id', 'nameFile', 'url', 'createdAt', 'updatedAt']
            }
        ]
    };
}

async function findDepartmentById(departmentId) {
    return Department.findByPk(departmentId, {
        attributes: ['id', 'code', 'name', 'managerId', 'managerName']
    });
}

async function findTaskDepartmentsByManagerId(managerId) {
    return TaskDepartment.findAll({
        where: {
            managerId
        },
        include: [
            buildDocumentInclude(),
            {
                model: Department,
                as: 'department',
                attributes: ['id', 'code', 'name', 'managerId', 'managerName']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
}

async function findTaskDepartmentById(taskDepartmentId) {
    return TaskDepartment.findByPk(taskDepartmentId, {
        include: [
            buildDocumentInclude(),
            {
                model: Department,
                as: 'department',
                attributes: ['id', 'code', 'name', 'managerId', 'managerName']
            }
        ]
    });
}

async function findTaskDepartmentByDocumentAndManager(documentId, managerId) {
    return TaskDepartment.findOne({
        where: {
            documentId,
            managerId
        }
    });
}

async function findTaskDepartmentByDocumentAndDepartment(documentId, departmentId) {
    return TaskDepartment.findOne({
        where: {
            documentId,
            departmentId
        }
    });
}

async function createTaskDepartment(payload, options = {}) {
    return TaskDepartment.create(payload, options);
}

module.exports = {
    findTaskDepartmentsByManagerId,
    findDepartmentById,
    findTaskDepartmentById,
    findTaskDepartmentByDocumentAndManager,
    findTaskDepartmentByDocumentAndDepartment,
    createTaskDepartment
};
