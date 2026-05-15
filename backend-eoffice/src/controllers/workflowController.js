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
        const data = await workflowService.transferDocument(req.body);
        return sendSuccess(res, data, 'Chuyển văn bản thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function assignTasks(req, res) {
    try {
        const data = await workflowService.assignTasks(req.body);
        return sendSuccess(res, data, 'Phân rã task thành công', 201);
    } catch (error) {
        return sendError(res, error);
    }
}

async function summarize(req, res) {
    try {
        const data = await workflowService.summarizeDocument(req.body);
        return sendSuccess(res, data, 'Tạo cấu trúc tóm tắt AI thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function checkFormat(req, res) {
    try {
        const data = await workflowService.checkFormat(req.body);
        return sendSuccess(res, data, 'Tạo cấu trúc kiểm tra định dạng AI thành công');
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