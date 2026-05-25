const taskRepository = require('../repository/taskRepository');
const { TaskFile } = require('../models');
const sequelize = require('../config/db');
const cloudinaryService = require('./cloudinaryService');
const { TASK_STATUS, PRIORITY } = require('../constants/enums');

/**
 * Service xử lý logic nghiệp vụ liên quan đến Task
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
 * Lấy tất cả Task
 * @param {Object} query - { status, priority, memberId, page, limit }
 * @returns {Promise<Object>}
 */
async function getAllTasks(query = {}) {
    const result = await taskRepository.findAllTasks(query);
    return {
        ...result,
        rows: result.rows.map(normalizeRecord)
    };
}

/**
 * Lấy Task theo ID
 * @param {string} taskId
 * @returns {Promise<Object>}
 */
async function getTaskById(taskId) {
    if (!taskId) {
        throw createError('taskId là bắt buộc', 400);
    }

    const task = await taskRepository.findTaskById(taskId);
    if (!task) {
        throw createError('Không tìm thấy task', 404);
    }

    return normalizeRecord(task);
}

/**
 * Tạo mới Task
 * @param {Object} data - { documentId, memberId, assignerId, title, description, priority, dueDate, note }
 * @returns {Promise<Object>}
 */
async function createNewTask(data, files = []) {
    // Validate dữ liệu bắt buộc
    if (!data.documentId || !data.memberId || !data.title) {
        throw createError('documentId, memberId, và title là bắt buộc', 400);
    }

    // Kiểm tra Document tồn tại
    const document = await taskRepository.findDocumentById(data.documentId);
    if (!document) {
        throw createError('Không tìm thấy văn bản (document)', 404);
    }

    // Kiểm tra DepartmentMember tồn tại
    const member = await taskRepository.findDepartmentMemberById(data.memberId);
    if (!member) {
        throw createError('Không tìm thấy thành viên phòng ban', 404);
    }

    // Validate priority nếu có
    if (data.priority && !Object.values(PRIORITY).includes(data.priority)) {
        throw createError(`Độ ưu tiên không hợp lệ. Các giá trị cho phép: ${Object.values(PRIORITY).join(', ')}`, 400);
    }

    const transaction = await sequelize.transaction();
    const uploadedAssets = [];

    try {
        const newTask = await taskRepository.createTask({
            documentId: data.documentId,
            memberId: data.memberId,
            assignerId: data.assignerId || null,
            title: data.title,
            description: data.description || null,
            status: data.status || TASK_STATUS.TODO,
            priority: data.priority || PRIORITY.MEDIUM,
            dueDate: data.dueDate || null,
            progress: data.progress || 0,
            note: data.note || null
        }, { transaction });

        if (Array.isArray(files) && files.length > 0) {
            const taskFiles = [];
            for (const [index, file] of files.entries()) {
                const fileName = `task_${newTask.id}_${Date.now()}_${index}_${file.originalname}`;
                const result = await cloudinaryService.uploadBufferToCloudinary(file.buffer, fileName, {
                    contentType: file.mimetype,
                    folder: 'tasks'
                });

                if (!result.success || (!result.secureUrl && !result.url)) {
                    throw createError(`Upload file "${files[index].originalname}" thất bại`, 500);
                }

                uploadedAssets.push({
                    publicId: result.publicId,
                    resourceType: result.resourceType
                });

                taskFiles.push({
                    taskId: newTask.id,
                    nameFile: files[index].originalname,
                    url: result.secureUrl || result.url
                });
            }

            await TaskFile.bulkCreate(taskFiles, { transaction });
        }

        await transaction.commit();

        const createdTask = await taskRepository.findTaskById(newTask.id);
        return normalizeRecord(createdTask);
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        for (const asset of uploadedAssets) {
            if (asset.publicId) {
                try {
                    await cloudinaryService.deleteAssetFromCloudinary(asset.publicId, asset.resourceType || 'raw');
                } catch (cleanupError) {
                    console.error('Failed to cleanup uploaded task file', cleanupError);
                }
            }
        }

        throw error;
    }
}

/**
 * Cập nhật Task
 * @param {string} taskId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function updateExistingTask(taskId, data) {
    if (!taskId) {
        throw createError('taskId là bắt buộc', 400);
    }

    const task = await taskRepository.findTaskById(taskId);
    if (!task) {
        throw createError('Không tìm thấy task', 404);
    }

    // Validate priority nếu có
    if (data.priority && !Object.values(PRIORITY).includes(data.priority)) {
        throw createError(`Độ ưu tiên không hợp lệ. Các giá trị cho phép: ${Object.values(PRIORITY).join(', ')}`, 400);
    }

    // Validate status nếu có
    if (data.status && !Object.values(TASK_STATUS).includes(data.status)) {
        throw createError(`Trạng thái không hợp lệ. Các giá trị cho phép: ${Object.values(TASK_STATUS).join(', ')}`, 400);
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.note !== undefined) updateData.note = data.note;
    if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;

    const updatedTask = await taskRepository.updateTask(taskId, updateData);
    return normalizeRecord(updatedTask);
}

/**
 * Xóa Task
 * @param {string} taskId
 * @returns {Promise<Object>}
 */
async function deleteTask(taskId) {
    if (!taskId) {
        throw createError('taskId là bắt buộc', 400);
    }

    const task = await taskRepository.findTaskById(taskId);
    if (!task) {
        throw createError('Không tìm thấy task', 404);
    }

    await taskRepository.deleteTask(taskId);
    return { message: 'Xóa task thành công' };
}

/**
 * Lấy danh sách Task theo memberId
 * @param {string} memberId
 * @param {Object} query
 * @returns {Promise<Object>}
 */
async function getTasksByMemberId(memberId, query = {}) {
    if (!memberId) {
        throw createError('memberId là bắt buộc', 400);
    }

    const member = await taskRepository.findDepartmentMemberById(memberId);
    if (!member) {
        throw createError('Không tìm thấy thành viên phòng ban', 404);
    }

    const result = await taskRepository.findTasksByMemberId(memberId, query);
    return {
        ...result,
        rows: result.rows.map(normalizeRecord)
    };
}

module.exports = {
    getAllTasks,
    getTaskById,
    createNewTask,
    updateExistingTask,
    deleteTask,
    getTasksByMemberId
};
