const departmentMemberRepository = require('../repository/departmentMemberRepository');

/**
 * Service xử lý logic nghiệp vụ liên quan đến DepartmentMember
 */

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function normalizeRecord(record) {
    return record?.get ? record.get({ plain: true }) : record;
}

/**
 * Lấy danh sách thành viên của một department
 * @param {string} departmentId
 * @returns {Promise<Array>}
 */
async function getMembersByDepartmentId(departmentId) {
    if (!departmentId || typeof departmentId !== 'string') {
        throw createError('departmentId là bắt buộc và phải là chuỗi', 400);
    }

    const members = await departmentMemberRepository.findMembersByDepartmentId(departmentId);
    return members.map(normalizeRecord);
}

/**
 * Lấy thông tin chi tiết một thành viên
 * @param {string} memberId
 * @returns {Promise<Object>}
 */
async function getMemberById(memberId) {
    if (!memberId) {
        throw createError('memberId là bắt buộc', 400);
    }

    const member = await departmentMemberRepository.findMemberById(memberId);
    if (!member) {
        throw createError('Không tìm thấy thành viên', 404);
    }

    return normalizeRecord(member);
}

/**
 * Thêm thành viên vào department
 * @param {string} departmentId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function addMemberToDepartment(departmentId, userId) {
    if (!departmentId || !userId) {
        throw createError('departmentId và userId là bắt buộc', 400);
    }

    // Kiểm tra xem member đã tồn tại hay chưa
    const existingMember = await departmentMemberRepository.findExistingMember(departmentId, userId);
    if (existingMember) {
        throw createError('Thành viên này đã tồn tại trong phòng ban', 409);
    }

    const newMember = await departmentMemberRepository.createMember({
        departmentId,
        userId
    });

    return normalizeRecord(newMember);
}

/**
 * Xóa thành viên khỏi department
 * @param {string} memberId
 * @returns {Promise<Object>}
 */
async function removeMemberFromDepartment(memberId) {
    if (!memberId) {
        throw createError('memberId là bắt buộc', 400);
    }

    const member = await departmentMemberRepository.findMemberById(memberId);
    if (!member) {
        throw createError('Không tìm thấy thành viên', 404);
    }

    await departmentMemberRepository.deleteMember(memberId);
    return { message: 'Xóa thành viên thành công' };
}

module.exports = {
    getMembersByDepartmentId,
    getMemberById,
    addMemberToDepartment,
    removeMemberFromDepartment
};
