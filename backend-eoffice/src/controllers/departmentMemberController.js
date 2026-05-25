const departmentMemberService = require('../services/departmentMemberService');

/**
 * Helper functions để xử lý response
 */
function sendSuccess(res, data, message, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        data,
        message
    });
}

function sendError(res, error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        data: null,
        message: error.message || 'Lỗi hệ thống'
    });
}

/**
 * GET /api/departments/:departmentId/members
 * Lấy danh sách thành viên của một department
 */
async function getMembersByDepartmentId(req, res) {
    try {
        const { departmentId } = req.params;
        const members = await departmentMemberService.getMembersByDepartmentId(departmentId);
        return sendSuccess(res, members, 'Lấy danh sách thành viên thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

/**
 * GET /api/members/:memberId
 * Lấy thông tin chi tiết một thành viên
 */
async function getMemberById(req, res) {
    try {
        const { memberId } = req.params;
        const member = await departmentMemberService.getMemberById(memberId);
        return sendSuccess(res, member, 'Lấy thông tin thành viên thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

/**
 * POST /api/departments/:departmentId/members
 * Thêm thành viên vào department
 */
async function addMemberToDepartment(req, res) {
    try {
        const { departmentId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return sendError(res, {
                statusCode: 400,
                message: 'userId là bắt buộc'
            });
        }

        const newMember = await departmentMemberService.addMemberToDepartment(departmentId, userId);
        return sendSuccess(res, newMember, 'Thêm thành viên thành công', 201);
    } catch (error) {
        return sendError(res, error);
    }
}

/**
 * DELETE /api/members/:memberId
 * Xóa thành viên khỏi department
 */
async function removeMemberFromDepartment(req, res) {
    try {
        const { memberId } = req.params;
        const result = await departmentMemberService.removeMemberFromDepartment(memberId);
        return sendSuccess(res, result, 'Xóa thành viên thành công');
    } catch (error) {
        return sendError(res, error);
    }
}

module.exports = {
    getMembersByDepartmentId,
    getMemberById,
    addMemberToDepartment,
    removeMemberFromDepartment
};
