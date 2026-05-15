const User = require('../models/userModel');
const { ROLES } = require('../constants/enums');

async function findAllUsers() {
    return User.findAll({
        attributes: ['id', 'fullName', 'role', 'email'],
        order: [['createdAt', 'DESC']]
    });
}

async function findUserById(id) {
    return User.findByPk(id, {
        attributes: ['id', 'fullName', 'role', 'email']
    });
}

async function createUser(payload) {
    return User.create({
        id: payload.id,
        fullName: payload.fullName,
        role: payload.role || ROLES.SPECIALIST,
        email: payload.email
    });
}

async function updateUserById(id, payload) {
    const user = await User.findByPk(id);
    if (!user) {
        return null;
    }

    await user.update(payload);
    return user;
}

async function deleteUserById(id) {
    return User.destroy({
        where: { id }
    });
}

module.exports = {
    findAllUsers,
    findUserById,
    createUser,
    updateUserById,
    deleteUserById
};
