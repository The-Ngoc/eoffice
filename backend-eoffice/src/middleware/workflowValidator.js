/**
 * Workflow Validator Middleware
 * Ensures valid status transitions for documents
 */

const { DOCUMENT_STATUS, TASK_STATUS } = require('../constants/enums');

/**
 * Valid status transitions for documents
 * Defines which statuses can transition to which
 */
const VALID_DOCUMENT_TRANSITIONS = {
    [DOCUMENT_STATUS.DRAFT]: [
        DOCUMENT_STATUS.PENDING_LEADER,
        DOCUMENT_STATUS.REJECTED
    ],
    [DOCUMENT_STATUS.PENDING_LEADER]: [
        DOCUMENT_STATUS.APPROVED,
        DOCUMENT_STATUS.REJECTED,
        DOCUMENT_STATUS.DRAFT
    ],
    [DOCUMENT_STATUS.APPROVED]: [
        DOCUMENT_STATUS.ASSIGNED,
        DOCUMENT_STATUS.REJECTED
    ],
    [DOCUMENT_STATUS.ASSIGNED]: [
        DOCUMENT_STATUS.PROCESSING,
        DOCUMENT_STATUS.REJECTED
    ],
    [DOCUMENT_STATUS.PROCESSING]: [
        DOCUMENT_STATUS.COMPLETED,
        DOCUMENT_STATUS.REJECTED
    ],
    [DOCUMENT_STATUS.COMPLETED]: [
        DOCUMENT_STATUS.PUBLISHED
    ],
    [DOCUMENT_STATUS.PUBLISHED]: [],
    [DOCUMENT_STATUS.REJECTED]: [
        DOCUMENT_STATUS.DRAFT
    ]
};

/**
 * Valid task status transitions
 */
const VALID_TASK_TRANSITIONS = {
    [TASK_STATUS.TODO]: [
        TASK_STATUS.DOING,
        TASK_STATUS.DONE
    ],
    [TASK_STATUS.DOING]: [
        TASK_STATUS.WAITING_APPROVAL,
        TASK_STATUS.DONE,
        TASK_STATUS.TODO
    ],
    [TASK_STATUS.WAITING_APPROVAL]: [
        TASK_STATUS.DONE,
        TASK_STATUS.DOING
    ],
    [TASK_STATUS.DONE]: [],
    [TASK_STATUS.OVERDUE]: [
        TASK_STATUS.DONE,
        TASK_STATUS.DOING
    ]
};

/**
 * Validate document status transition
 * @param {string} currentStatus - Current document status
 * @param {string} nextStatus - Target document status
 * @returns {boolean} - True if transition is valid
 */
function isValidDocumentTransition(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) {
        return true; // Allow same status (idempotent)
    }

    const validNextStatuses = VALID_DOCUMENT_TRANSITIONS[currentStatus];
    if (!validNextStatuses) {
        return false; // Invalid current status
    }

    return validNextStatuses.includes(nextStatus);
}

/**
 * Validate task status transition
 * @param {string} currentStatus - Current task status
 * @param {string} nextStatus - Target task status
 * @returns {boolean} - True if transition is valid
 */
function isValidTaskTransition(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) {
        return true; // Allow same status (idempotent)
    }

    const validNextStatuses = VALID_TASK_TRANSITIONS[currentStatus];
    if (!validNextStatuses) {
        return false; // Invalid current status
    }

    return validNextStatuses.includes(nextStatus);
}

/**
 * Middleware to validate document status transition
 */
function validateDocumentStatusTransition(req, res, next) {
    const { currentStatus, nextStatus } = req.body;

    if (!currentStatus || !nextStatus) {
        return next(); // Skip if not provided
    }

    if (!isValidDocumentTransition(currentStatus, nextStatus)) {
        return res.status(400).json({
            success: false,
            data: null,
            message: `Invalid status transition from ${currentStatus} to ${nextStatus}`
        });
    }

    next();
}

/**
 * Middleware to validate task status transition
 */
function validateTaskStatusTransition(req, res, next) {
    const { currentStatus, nextStatus } = req.body;

    if (!currentStatus || !nextStatus) {
        return next(); // Skip if not provided
    }

    if (!isValidTaskTransition(currentStatus, nextStatus)) {
        return res.status(400).json({
            success: false,
            data: null,
            message: `Invalid task status transition from ${currentStatus} to ${nextStatus}`
        });
    }

    next();
}

module.exports = {
    VALID_DOCUMENT_TRANSITIONS,
    VALID_TASK_TRANSITIONS,
    isValidDocumentTransition,
    isValidTaskTransition,
    validateDocumentStatusTransition,
    validateTaskStatusTransition
};
