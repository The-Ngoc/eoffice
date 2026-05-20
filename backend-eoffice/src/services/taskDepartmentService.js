const taskDepartmentRepository = require('../repository/taskDepartmentRepository');

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function normalizeRecord(record) {
    return record?.get ? record.get({ plain: true }) : record;
}

function mapFile(file) {
    return {
        id: file.id,
        nameFile: file.nameFile,
        url: file.url,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
    };
}

function mapDocument(document) {
    if (!document) {
        return null;
    }

    const item = normalizeRecord(document);

    return {
        id: item.id,
        documentNumber: item.documentNumber,
        symbol: item.symbol,
        title: item.title,
        sender: item.sender,
        status: item.status,
        urgency: item.urgency,
        priority: item.priority || null,
        type: item.type,
        description: item.description || null,
        summary: item.summary || null,
        legalWarning: Boolean(item.legalWarning),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        files: Array.isArray(item.files) ? item.files.map(mapFile) : []
    };
}

function mapTaskDepartment(taskDepartment) {
    const item = normalizeRecord(taskDepartment);

    return {
        id: item.id,
        note: item.note || null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        department: item.department ? {
            id: item.department.id,
            code: item.department.code,
            name: item.department.name,
            managerId: item.department.managerId,
            managerName: item.department.managerName
        } : null,
        document: mapDocument(item.document)
    };
}



async function getTasksByManagerId(managerId) {
    const normalizedManagerId = String(managerId || '').trim();
    if (!normalizedManagerId) {
        throw createError('managerId là bắt buộc', 400);
    }

    const taskDepartments = await taskDepartmentRepository.findTaskDepartmentsByManagerId(normalizedManagerId);
    return taskDepartments.map(mapTaskDepartment);
}

module.exports = {
    getTasksByManagerId
};
