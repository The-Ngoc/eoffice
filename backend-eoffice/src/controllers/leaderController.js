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
        const { docId, deptId } = req.body;
        const actor = {
            id: req.user?.id || req.headers['x-user-id'] || req.headers['user-id'] || req.body?.userId || null,
            name: req.headers['x-user-name'] || req.body?.userName || 'Leader'
        };

        const data = await leaderService.assignDepartmentToDocument(docId, deptId, actor);
        return sendSuccess(res, data, 'Cập nhật phòng ban xử lý thành công');
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
        const data = await leaderService.getDeptPerformance();
        return sendSuccess(res, data, 'Lấy hiệu suất phòng ban thành công');
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