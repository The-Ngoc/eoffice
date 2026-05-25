const { DepartmentMember, User, Department } = require('../models');

/**
 * Repository xử lý tất cả các truy vấn liên quan đến DepartmentMember
 */

/**
 * Lấy danh sách thành viên của một department
 * @param {string} departmentId - ID của department
 * @returns {Promise<Array>} - Danh sách DepartmentMember với thông tin User và Department
 */
async function findMembersByDepartmentId(departmentId) {
    return await DepartmentMember.findAll({
        where: { departmentId },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'fullName', 'email', 'role']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
}

/**
 * Lấy thông tin chi tiết một DepartmentMember
 * @param {string} memberId - ID của DepartmentMember
 * @returns {Promise<Object|null>}
 */
async function findMemberById(memberId) {
    return await DepartmentMember.findByPk(memberId, {
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'fullName', 'email', 'role']
            },
            {
                model: Department,
                as: 'department',
                attributes: ['id', 'code', 'name', 'managerId']
            }
        ]
    });
}

/**
 * Tạo mới DepartmentMember
 * @param {Object} data - { departmentId, userId }
 * @returns {Promise<Object>}
 */
async function createMember(data) {
    return await DepartmentMember.create(data);
}

/**
 * Xóa DepartmentMember
 * @param {string} memberId
 * @returns {Promise<number>} - Số bản ghi bị xóa
 */
async function deleteMember(memberId) {
    return await DepartmentMember.destroy({
        where: { id: memberId }
    });
}

/**
 * Kiểm tra xem user đã là thành viên của department hay chưa
 * @param {string} departmentId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function findExistingMember(departmentId, userId) {
    return await DepartmentMember.findOne({
        where: { departmentId, userId }
    });
}

module.exports = {
    findMembersByDepartmentId,
    findMemberById,
    createMember,
    deleteMember,
    findExistingMember
};
