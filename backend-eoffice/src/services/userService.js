const userRepository = require('../repository/userRepository');
const { ROLES } = require('../constants/enums');

const VALID_ROLES = Object.values(ROLES);

function buildResponse(data) {
    return {
        id: data.id,
        fullName: data.fullName,
        role: data.role,
        email: data.email
    };
}

function createNotFoundError(message) {
    const error = new Error(message);
    error.statusCode = 404;
    return error;
}

async function getAllUsers() {
    const users = await userRepository.findAllUsers();
    return users.map(buildResponse);
}

async function getUserById(id) {
    const user = await userRepository.findUserById(id);
    if (!user) {
        throw createNotFoundError('User không tồn tại');
    }
    return buildResponse(user);
}

async function createUser(payload) {
    if (!payload.id || !payload.fullName || !payload.email) {
        const error = new Error('id, fullName, email là bắt buộc');
        error.statusCode = 400;
        throw error;
    }

    const user = await userRepository.createUser(payload);
    return buildResponse(user);
}

async function updateUserRole(payload) {
    if (!payload?.id || !payload?.role) {
        const error = new Error('id và role là bắt buộc');
        error.statusCode = 400;
        throw error;
    }

    const role = String(payload.role).trim().toUpperCase();
    if (!VALID_ROLES.includes(role)) {
        const error = new Error(`role không hợp lệ. Chấp nhận: ${VALID_ROLES.join(', ')}`);
        error.statusCode = 400;
        throw error;
    }

    const updated = await userRepository.updateUserById(payload.id, { role });
    if (!updated) {
        throw createNotFoundError('User không tồn tại');
    }

    return buildResponse(updated);
}

async function deleteUser(id) {
    if (!id) {
        const error = new Error('id là bắt buộc');
        error.statusCode = 400;
        throw error;
    }

    const deleted = await userRepository.deleteUserById(id);
    if (!deleted) {
        throw createNotFoundError('User không tồn tại');
    }

    return { id, deleted: true };
}

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUserRole,
    deleteUser
};
