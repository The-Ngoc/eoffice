const specialistRepository = require('../repository/specialistRepository');
const managerRepository = require('../repository/managerRepository');
const cloudinaryService = require('./cloudinaryService');
const { TASK_STATUS } = require('../constants/enums');

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
    if (!userId) throw createError('Thiếu userId', 400);

    const member = await specialistRepository.findMemberByUserId(userId);
    if (!member) return [];

    const tasks = await specialistRepository.findTasksByMemberId(member.id);
    return tasks.map(mapTask);
}

async function getTaskDetail(taskId, requester = {}) {
    const userId = requester.id;
    if (!userId) throw createError('Thiếu userId', 400);
    if (!taskId) throw createError('Thiếu taskId', 400);

    const member = await specialistRepository.findMemberByUserId(userId);
    if (!member) throw createError('User chưa thuộc phòng ban nào', 403);

    const task = await specialistRepository.findTaskDetail(taskId);
    if (!task) throw createError('Task không tồn tại', 404);

    if (String(task.memberId) !== String(member.id)) {
        throw createError('Bạn không có quyền xem task này', 403);
    }

    return mapTaskDetail(task);
}

function clampProgress(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

async function updateProgress(taskId, payload = {}, requester = {}) {
    const userId = requester.id;
    if (!userId) throw createError('Thiếu userId', 400);
    if (!taskId) throw createError('Thiếu taskId', 400);

    const member = await specialistRepository.findMemberByUserId(userId);
    if (!member) throw createError('User chưa thuộc phòng ban nào', 403);

    const task = await specialistRepository.findTaskDetail(taskId);
    if (!task) throw createError('Task không tồn tại', 404);
    if (String(task.memberId) !== String(member.id)) {
        throw createError('Bạn không có quyền cập nhật task này', 403);
    }

    const progress = clampProgress(payload.progress);
    const content = payload.content ? String(payload.content).trim() : null;

    const nextStatus = progress >= 100 ? TASK_STATUS.DONE : TASK_STATUS.DOING;

    const updated = await specialistRepository.updateTaskById(taskId, {
        progress,
        status: nextStatus
    });

    await specialistRepository.createTaskHistory({
        taskId,
        userId,
        type: 'PROGRESS',
        progress,
        content
    });

    return mapTask(updated);
}

async function addComment(taskId, payload = {}, requester = {}) {
    const userId = requester.id;
    if (!userId) throw createError('Thiếu userId', 400);
    if (!taskId) throw createError('Thiếu taskId', 400);

    const member = await specialistRepository.findMemberByUserId(userId);
    if (!member) throw createError('User chưa thuộc phòng ban nào', 403);

    const task = await specialistRepository.findTaskDetail(taskId);
    if (!task) throw createError('Task không tồn tại', 404);
    if (String(task.memberId) !== String(member.id)) {
        throw createError('Bạn không có quyền cập nhật task này', 403);
    }

    const content = String(payload.content || '').trim();
    if (!content) throw createError('Nội dung comment là bắt buộc', 400);

    const history = await specialistRepository.createTaskHistory({
        taskId,
        userId,
        type: 'COMMENT',
        content
    });

    return normalizeRecord(history);
}

async function submitTask(taskId, payload = {}, files = [], requester = {}, options = {}) {
    const userId = requester.id;
    if (!userId) throw createError('Thiếu userId', 400);
    if (!taskId) throw createError('Thiếu taskId', 400);

    const member = await specialistRepository.findMemberByUserId(userId);
    if (!member) throw createError('User chưa thuộc phòng ban nào', 403);

    const task = await specialistRepository.findTaskDetail(taskId);
    if (!task) throw createError('Task không tồn tại', 404);
    if (String(task.memberId) !== String(member.id)) {
        throw createError('Bạn không có quyền nộp task này', 403);
    }

    const submissionNotes = payload.submissionNotes ? String(payload.submissionNotes) : null;
    const isResubmission = Boolean(options.resubmit);

    if (isResubmission && task.status !== TASK_STATUS.REJECTED) {
        throw createError('Chỉ có thể gửi lại khi task đang ở trạng thái REJECTED', 400);
    }

    if (isResubmission) {
        await specialistRepository.deleteTaskFiles(taskId);
    }

    const uploaded = [];
    if (Array.isArray(files) && files.length) {
        for (const file of files) {
            const uploadedResult = await cloudinaryService.uploadBufferToCloudinary(
                file.buffer,
                file.originalname,
                { contentType: file.mimetype }
            );

            uploaded.push({
                nameFile: file.originalname,
                url: uploadedResult.secureUrl || uploadedResult.url
            });
        }
    }

    if (uploaded.length) {
        await specialistRepository.addTaskFiles(uploaded.map((item) => ({
            taskId,
            nameFile: item.nameFile,
            url: item.url
        })));
    }

    const updated = await specialistRepository.updateTaskById(taskId, {
        progress: 100,
        status: TASK_STATUS.WAITING_APPROVAL,
        rejectionReason: null
    });

    await specialistRepository.createTaskHistory({
        taskId,
        userId,
        type: isResubmission ? 'RESUBMISSION' : 'SUBMISSION',
        progress: 100,
        content: submissionNotes
    });

    const mapped = mapTask(updated);

    // Placeholder “notify” payload (no realtime system wired yet)
    const assigner = await managerRepository.findUserById(task.assignerId);
    return {
        task: mapped,
        notify: assigner ? { toUserId: assigner.id, reason: 'TASK_SUBMITTED', taskId } : null
    };
}

async function deleteTaskFile(taskId, fileId, requester = {}) {
    const userId = requester.id;
    if (!userId) throw createError('Thiếu userId', 400);
    if (!taskId || !fileId) throw createError('Thiếu taskId/fileId', 400);

    const member = await specialistRepository.findMemberByUserId(userId);
    if (!member) throw createError('User chưa thuộc phòng ban nào', 403);

    const task = await specialistRepository.findTaskDetail(taskId);
    if (!task) throw createError('Task không tồn tại', 404);
    if (String(task.memberId) !== String(member.id)) {
        throw createError('Bạn không có quyền chỉnh file của task này', 403);
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

