require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./src/app');
const { Op } = require('sequelize');
const { ROLES } = require('./src/constants/enums');

const db = require('./src/models');
const sequelize = db.sequelize;

const PORT = process.env.PORT;
const VALID_ROLES = new Set(Object.values(ROLES));

function toDepartmentCode(name) {
    const normalized = String(name || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toUpperCase();

    return `DEPT_${normalized || 'UNASSIGNED'}`;
}

function mapRoleFromJobTitle(jobTitle, emptyRoleIndex) {
    const normalized = String(jobTitle || '').trim().toLowerCase();

    if (normalized === 'admin') {
        return ROLES.ADMIN;
    }

    if (normalized === 'manager') {
        return ROLES.MANAGER;
    }

    if (normalized === 'leader') {
        return ROLES.LEADER;
    }

    if (normalized === 'clerical' || normalized === 'van thu') {
        return ROLES.CLERICAL;
    }

    if (normalized === 'staff' || normalized === 'specialist' || normalized === 'chuyen vien') {
        return ROLES.SPECIALIST;
    }

    if (!normalized) {
        const defaultRoles = [ROLES.LEADER, ROLES.CLERICAL, ROLES.SPECIALIST];
        return defaultRoles[emptyRoleIndex] || ROLES.SPECIALIST;
    }

    return ROLES.SPECIALIST;
}


async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối DB thành công.');

        // await sequelize.sync({ alter: true });
        // console.log('✅ Database đã được đồng bộ hóa.');

        // await seedInitialData();
        // console.log('✅ Đã nạp dữ liệu mẫu thành công.');

        app.listen(PORT, () => {
            console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Lỗi khởi động:', err);
        process.exit(1);
    }
}
startServer();