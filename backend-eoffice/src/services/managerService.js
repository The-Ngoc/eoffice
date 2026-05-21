const managerRepository = require('../repository/managerRepository');

function createSkeletonResponse(name) {
    return {
        scope: 'manager',
        action: name
    };
}

async function getAllTasks(query = {}) {
    void query;
    await managerRepository.getAllTasks(query);
    return createSkeletonResponse('getAllTasks');
}

async function createTask(payload = {}) {
    void payload;
    await managerRepository.createTask(payload);
    return createSkeletonResponse('createTask');
}

async function receiveTaskFromLeader(taskId, payload = {}) {
    void taskId;
    void payload;
    await managerRepository.receiveTaskFromLeader(taskId, payload);
    return createSkeletonResponse('receiveTaskFromLeader');
}

async function getTaskProgress(taskId) {
    void taskId;
    await managerRepository.getTaskProgress(taskId);
    return createSkeletonResponse('getTaskProgress');
}

async function getProgressReports(taskId) {
    void taskId;
    await managerRepository.getProgressReports(taskId);
    return createSkeletonResponse('getProgressReports');
}

async function updateTaskStatus(taskId, payload = {}) {
    void taskId;
    void payload;
    await managerRepository.updateTaskStatus(taskId, payload);
    return createSkeletonResponse('updateTaskStatus');
}

async function cancelTask(taskId, payload = {}) {
    void taskId;
    void payload;
    await managerRepository.cancelTask(taskId, payload);
    return createSkeletonResponse('cancelTask');
}

async function approveTask(taskId, payload = {}) {
    void taskId;
    void payload;
    await managerRepository.approveTask(taskId, payload);
    return createSkeletonResponse('approveTask');
}

async function rejectTask(taskId, payload = {}) {
    void taskId;
    void payload;
    await managerRepository.rejectTask(taskId, payload);
    return createSkeletonResponse('rejectTask');
}

module.exports = {
    getAllTasks,
    createTask,
    receiveTaskFromLeader,
    getTaskProgress,
    getProgressReports,
    updateTaskStatus,
    cancelTask,
    approveTask,
    rejectTask
};
