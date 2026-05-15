const User = require('../models/userModel');
const { ROLES, ROLE_HIERARCHY } = require('../constants/enums');

const ROLE_ALIASES = {
    lanhdao: ROLES.LEADER,
    truongphong: ROLES.MANAGER,
    chuyenvien: ROLES.SPECIALIST,
    vanthu: ROLES.CLERICAL,
    quantri: ROLES.ADMIN,
    specialist: ROLES.SPECIALIST,
    staff: ROLES.SPECIALIST
};

function getRequestRole(req) {
    return req.user?.role || req.headers['x-user-role'] || req.headers['x-role'] || req.headers.role;
}

function getRequestUserId(req) {
    return req.user?.id
        || req.headers['x-user-id']
        || req.headers['user-id']
        || req.query?.userId
        || req.body?.userId
        || null;
}

function normalizeRole(role) {
    const normalized = String(role || '').trim().toLowerCase();
    const aliased = ROLE_ALIASES[normalized];
    if (aliased) {
        return aliased;
    }
    // Return uppercase if it matches a valid role
    const uppercase = normalized.toUpperCase();
    if (Object.values(ROLES).includes(uppercase)) {
        return uppercase;
    }
    return normalized;
}

async function resolveRoleFromUserId(req) {
    const userId = getRequestUserId(req);
    if (!userId) {
        return null;
    }

    const user = await User.findByPk(userId, { attributes: ['id', 'role'] });
    if (!user) {
        return null;
    }

    req.user = req.user || {};
    req.user.id = user.id;
    req.user.role = user.role;

    return user.role;
}

function canBypassRoleCheck() {
    return process.env.NODE_ENV !== 'production' || process.env.AUTH_DEV_BYPASS === 'true';
}

function checkRole(allowedRoles = []) {
    return async (req, res, next) => {
        let role = getRequestRole(req);

        if (!role) {
            role = await resolveRoleFromUserId(req);
        }

        if (!role && canBypassRoleCheck()) {
            role = allowedRoles[0] || ROLES.SPECIALIST;
        }

        const normalizedRole = normalizeRole(role);
        const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

        if (!role) {
            return res.status(401).json({
                success: false,
                data: null,
                message: 'Thiếu thông tin role'
            });
        }

        if (!normalizedAllowedRoles.includes(normalizedRole)) {
            return res.status(403).json({
                success: false,
                data: null,
                message: 'Không có quyền truy cập'
            });
        }

        req.user = req.user || {};
        req.user.role = normalizedRole;

        return next();
    };
}

module.exports = checkRole;