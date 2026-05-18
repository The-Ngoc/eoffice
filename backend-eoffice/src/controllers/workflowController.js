const workflowService = require('../services/workflowService');

function sendSuccess(res, data, message, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        data,
        message
    });
}

function sendError(res, error) {
    return res.status(error.statusCode || 500).json({
        success: false,
        data: null,
        message: error.message || 'Lỗi hệ thống'
    });
}

async function getDocuments(req, res) {
    try {
        const data = await workflowService.getDocumentsForLeader(req.query);
        return sendSuccess(res, data, 'Lấy danh sách văn bản thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function createDocument(req, res) {
    try {
        const data = await workflowService.createDocument(req.body);
        return sendSuccess(res, data, 'Khởi tạo văn bản thành công', 201);
    } catch (error) {
        return sendError(res, error);
    }
}

async function updateDocumentStatus(req, res) {
    try {
        const data = await workflowService.updateDocumentStatus(req.params.id, req.body);
        return sendSuccess(res, data, 'Cập nhật trạng thái văn bản thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function transferDocument(req, res) {
    try {
        return sendError(res, {
            statusCode: 501,
            message: 'Endpoint này không còn được hỗ trợ. Hãy sử dụng Manager API để tạo task.'
        });
    } catch (error) {
        return sendError(res, error);
    }
}

async function assignTasks(req, res) {
    try {
        return sendError(res, {
            statusCode: 501,
            message: 'Endpoint này không còn được hỗ trợ. Hãy sử dụng Manager API để tạo task.'
        });
    } catch (error) {
        return sendError(res, error);
    }
}

async function summarize(req, res) {
    try {
        return sendError(res, {
            statusCode: 501,
            message: 'Endpoint này không còn được hỗ trợ.'
        });
    } catch (error) {
        return sendError(res, error);
    }
}

async function checkFormat(req, res) {
    try {
        return sendError(res, {
            statusCode: 501,
            message: 'Endpoint này không còn được hỗ trợ.'
        });
    } catch (error) {
        return sendError(res, error);
    }
}

module.exports = {
    getDocuments,
    createDocument,
    updateDocumentStatus,
    transferDocument,
    assignTasks,
    summarize,
    checkFormat
};