const userService = require('../services/userService');

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

exports.getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        return sendSuccess(res, users, 'Lấy danh sách User thành công');
    } catch (error) {
        console.error('❌ Lỗi khi lấy danh sách User:', error);
        return sendError(res, error);
    }
};

exports.getMeByID = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService.getUserById(id);
        return sendSuccess(res, user, 'Lấy chi tiết User thành công');
    } catch (error) {
        console.error('❌ Lỗi khi lấy User:', error);
        return sendError(res, error);
    }
};

exports.addUser = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);
        return sendSuccess(res, user, 'Tạo User thành công', 201);
    } catch (error) {
        console.error('❌ Lỗi khi tạo User:', error);
        return sendError(res, error);
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const user = await userService.updateUserRole(req.body);
        return sendSuccess(res, user, 'Cập nhật User thành công');
    } catch (error) {
        console.error('❌ Lỗi khi cập nhật User:', error);
        return sendError(res, error);
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const id = req.body?.id || req.query?.id || req.params?.id;
        const result = await userService.deleteUser(id);
        return sendSuccess(res, result, 'Xóa User thành công');
    } catch (error) {
        console.error('❌ Lỗi khi xóa User:', error);
        return sendError(res, error);
    }
};
