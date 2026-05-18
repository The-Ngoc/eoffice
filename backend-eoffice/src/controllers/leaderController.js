const leaderService = require('../services/leaderService');

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

async function getWailtingLeader(req, res) {
    try {
        const data = await leaderService.getPendingDocuments();
        return sendSuccess(res, data, 'Lấy danh sách văn bản chờ duyệt thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function approve(req, res) {
    try {
        const { id } = req.body;
        const data = await leaderService.approveDocument(id);
        return sendSuccess(res, data, 'Duyệt văn bản thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function reject(req, res) {
    try {
        const { id, reason } = req.body;
        const data = await leaderService.rejectDocument(id, reason);
        return sendSuccess(res, data, 'Từ chối văn bản thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function assignDepartment(req, res) {
    try {
        return sendError(res, {
            statusCode: 501,
            message: 'Endpoint này không còn được hỗ trợ. Hãy sử dụng Manager API để tạo task.'
        });
    } catch (error) {
        return sendError(res, error);
    }
}

async function getDepartments(req, res) {
    try {
        const data = await leaderService.getDepartments();
        return sendSuccess(res, data, 'Lấy danh sách phòng ban thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function getDepartmentManager(req, res) {
    try {
        const { deptId } = req.params;
        const data = await leaderService.getDepartmentManager(deptId);
        return sendSuccess(res, data, 'Lấy thông tin trưởng phòng thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function getStats(req, res) {
    try {
        const data = await leaderService.getStats();
        return sendSuccess(res, data, 'Lấy KPI dashboard thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

async function getDeptPerformance(req, res) {
    try {
        return sendError(res, {
            statusCode: 501,
            message: 'Endpoint này không còn được hỗ trợ'
        });
    } catch (error) {
        return sendError(res, error);
    }
}

module.exports = {
    getWailtingLeader,
    approve,
    reject,
    assignDepartment,
    getDepartments,
    getDepartmentManager,
    getStats,
    getDeptPerformance
};