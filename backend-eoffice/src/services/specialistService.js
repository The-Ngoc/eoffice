const specialistRepository = require('../repository/specialistRepository');
const sequelize = require('../config/db');
const cloudinaryService = require('./cloudinaryService');
const { TASK_STATUS, ROLES } = require('../constants/enums');

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function normalizeRecord(record) {
    return record?.get ? record.get({ plain: true }) : record;
}

function mapTask(task) {
    const item = normalizeRecord(task);
    return {
        id: item.id,
        title: item.title,
        description: item.description || null,
        status: item.status,
        priority: item.priority || null,
        dueDate: item.dueDate || null,
        progress: Number.isFinite(item.progress) ? item.progress : 0,
        rejectionReason: item.rejectionReason || null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        assigner: item.assigner ? {
            id: item.assigner.id,
            fullName: item.assigner.fullName,
            email: item.assigner.email,
            role: item.assigner.role
        } : null,
        document: item.document ? {
            id: item.document.id,
            documentNumber: item.document.documentNumber,
            title: item.document.title
        } : null
    };
}

function mapTaskDetail(task) {
    const item = normalizeRecord(task);
    return {
        ...mapTask(item),
        member: item.member ? {
            id: item.member.id,
            departmentId: item.member.departmentId,
            userId: item.member.userId,
            user: item.member.user ? {
                id: item.member.user.id,
                fullName: item.member.user.fullName,
                email: item.member.user.email,
                role: item.member.user.role
            } : null
        } : null,
        files: Array.isArray(item.files) ? item.files.map((f) => ({
            id: f.id,
            nameFile: f.nameFile,
            url: f.url,
            createdAt: f.createdAt
        })) : [],
        history: Array.isArray(item.history) ? item.history.map((h) => ({
            id: h.id,
            type: h.type,
            progress: h.progress ?? null,
            content: h.content ?? null,
            createdAt: h.createdAt,
            user: h.user ? {
                id: h.user.id,
                fullName: h.user.fullName,
                email: h.user.email,
                role: h.user.role
            } : null
        })) : []
    };
}

async function getMyTasks(query = {}, requester = {}) {
    const userId = requester.id || query.userId;
    // If no userId provided, return empty list (no auth) instead of throwing
    if (!userId) return [];

    const member = await specialistRepository.findMemberByUserId(userId);
    if (!member) return [];

    const tasks = await specialistRepository.findTasksByMemberId(member.id);
    return tasks.map(mapTask);
}

async function getTaskDetail(taskId, requester = {}) {
    if (!taskId) throw createError('Thiếu taskId', 400);

    const task = await specialistRepository.findTaskDetail(taskId);
    if (!task) throw createError('Task không tồn tại', 404);

    // If requester provided and is a member, enforce member restriction
    const userId = requester.id;
    if (userId) {
        const member = await specialistRepository.findMemberByUserId(userId);
        if (!member) throw createError('User chưa thuộc phòng ban nào', 403);
        if (String(task.memberId) !== String(member.id)) {
            throw createError('Bạn không có quyền xem task này', 403);
        }
    }

    return mapTaskDetail(task);
}

function clampProgress(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

async function resolveSpecialistRequester(requester = {}) {
    // If no requester info provided, return nulls and let callers decide
    const userId = requester.id;
    if (!userId) return { user: null, member: null };

    const requesterRole = String(requester.role || '').trim().toUpperCase();
    if (requesterRole && requesterRole !== ROLES.SPECIALIST) {
        throw createError('Không có quyền truy cập', 403);
    }

    const user = await specialistRepository.findUserById(userId);
    if (!user) {
        throw createError('Không tìm thấy người dùng', 401);
    }

    if (String(user.role || '').trim().toUpperCase() !== ROLES.SPECIALIST) {
        throw createError('Không có quyền truy cập', 403);
    }

    const member = await specialistRepository.findMemberByUserId(userId);
    if (!member) {
        throw createError('User chưa thuộc phòng ban nào', 403);
    }

    return { user, member };
}

async function updateProgress(taskId, payload = {}, requester = {}) {
    const progress = clampProgress(payload.progress);

    const nextStatus = progress >= 100 ? TASK_STATUS.DONE : TASK_STATUS.DOING;

    const updated = await specialistRepository.updateTaskById(taskId, {
        progress,
        status: nextStatus
    });

    if (!updated) {
        throw createError('Không thể cập nhật progress cho task', 500);
    }

    return mapTask(updated);
}

async function addComment(taskId, payload = {}, requester = {}) {
    const { user, member } = await resolveSpecialistRequester(requester);

    if (!taskId) throw createError('Thiếu taskId', 400);

    const task = await specialistRepository.findTaskDetail(taskId);
    if (!task) throw createError('Task không tồn tại', 404);

    // If requester provided and is a member, enforce membership
    if (member && String(task.memberId) !== String(member.id)) {
        throw createError('Bạn không có quyền cập nhật task này', 403);
    }

    const content = String(payload.content || '').trim();
    if (!content) throw createError('Nội dung comment là bắt buộc', 400);

    const history = await specialistRepository.createTaskHistory({
        taskId,
        userId: user ? user.id : null,
        type: 'COMMENT',
        content
    });

    return normalizeRecord(history);
}

async function submitTask(taskId, payload = {}, files = [], requester = {}, options = {}) {
    const { user, member } = await resolveSpecialistRequester(requester);

    if (!taskId) throw createError('Thiếu taskId', 400);

    const task = await specialistRepository.findTaskDetail(taskId);
    if (!task) throw createError('Task không tồn tại', 404);

    const submissionNotes = payload.submissionNotes ? String(payload.submissionNotes).trim() : null;
    const isResubmission = Boolean(options.resubmit);

    if (isResubmission) {
        if (task.status !== TASK_STATUS.REJECTED) {
            throw createError('Chỉ có thể gửi lại khi task đang ở trạng thái REJECTED', 409);
        }
    }

    const uploadedAssets = [];
    const transaction = await sequelize.transaction();

    try {
        if (isResubmission) {
            await specialistRepository.deleteTaskFiles(taskId, { transaction });
        }

        const taskFiles = [];
        if (Array.isArray(files) && files.length > 0) {
            for (const [index, file] of files.entries()) {
                const fileName = `task_${taskId}_${Date.now()}_${index}_${file.originalname}`;
                const result = await cloudinaryService.uploadBufferToCloudinary(file.buffer, fileName, {
                    contentType: file.mimetype,
                    folder: 'tasks'
                });

                if (!result.success || (!result.secureUrl && !result.url)) {
                    throw createError(`Upload file "${file.originalname}" thất bại`, 500);
                }

                uploadedAssets.push({
                    publicId: result.publicId,
                    resourceType: result.resourceType
                });

                taskFiles.push({
                    taskId,
                    nameFile: file.originalname,
                    url: result.secureUrl || result.url
                });
            }

            await specialistRepository.addTaskFiles(taskFiles, { transaction });
        }

        await specialistRepository.updateTaskById(taskId, {
            progress: 100,
            status: TASK_STATUS.WAITING_APPROVAL,
            rejectionReason: null
        }, { transaction });

        await transaction.commit();

        const updatedTask = await specialistRepository.findTaskDetail(taskId);
        return mapTaskDetail(updatedTask);
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        for (const asset of uploadedAssets) {
            if (asset.publicId) {
                try {
                    await cloudinaryService.deleteAssetFromCloudinary(asset.publicId, asset.resourceType || 'raw');
                } catch (cleanupError) {
                    console.error('Failed to cleanup uploaded specialist task file', cleanupError);
                }
            }
        }

        throw error;
    }
}

async function deleteTaskFile(taskId, fileId, requester = {}) {
    if (!taskId || !fileId) throw createError('Thiếu taskId/fileId', 400);

    // If requester provided, enforce membership
    const userId = requester.id;
    if (userId) {
        const member = await specialistRepository.findMemberByUserId(userId);
        if (!member) throw createError('User chưa thuộc phòng ban nào', 403);

        const task = await specialistRepository.findTaskDetail(taskId);
        if (!task) throw createError('Task không tồn tại', 404);
        if (String(task.memberId) !== String(member.id)) {
            throw createError('Bạn không có quyền chỉnh file của task này', 403);
        }
    }

    await specialistRepository.deleteTaskFileById(taskId, fileId);
    return { success: true };
}

module.exports = {
    getMyTasks,
    getTaskDetail,
    updateProgress,
    addComment,
    submitTask,
    deleteTaskFile
};

