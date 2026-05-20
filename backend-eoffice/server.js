require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./src/app');
const { Op } = require('sequelize');
const { ROLES } = require('./src/constants/enums');

const db = require('./src/models');
const sequelize = db.sequelize;

const PORT = process.env.PORT;
const FAKE_DATA_PATH = path.resolve(__dirname, '../eoffice-teams-fe/src/util/fake-data.json');
const VALID_ROLES = new Set(Object.values(ROLES));

function normalizeDepartmentName(rawValue) {
    const value = String(rawValue || '').trim();
    return value || 'Chua phan bo';
}

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

function buildUsersFromFakeData(fakeData) {
    let emptyRoleIndex = 0;

    return fakeData.map((item) => {
        const computedRole = mapRoleFromJobTitle(item.jobTitle, emptyRoleIndex);
        const hasEmptyJobTitle = !String(item.jobTitle || '').trim();
        if (hasEmptyJobTitle) {
            emptyRoleIndex += 1;
        }

        const role = VALID_ROLES.has(computedRole) ? computedRole : 'SPECIALIST';
        const fullName = String(item.displayName || item.userPrincipalName || item.mail || '').trim();
        const email = String(item.mail || item.userPrincipalName || '').trim().toLowerCase();
        const departmentName = normalizeDepartmentName(item.officeLocation);
        const departmentCode = toDepartmentCode(departmentName);

        return {
            id: String(item.id || '').trim(),
            fullName,
            email,
            role,
            departmentName,
            departmentCode

        };
    }).filter((item) => item.id && item.fullName && item.email);
}

async function seedInitialData() {
    const { User, Document, Department, DepartmentMember } = db;

    if (!fs.existsSync(FAKE_DATA_PATH)) {
        throw new Error(`Khong tim thay fake-data.json tai: ${FAKE_DATA_PATH}`);
    }

    const raw = fs.readFileSync(FAKE_DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('fake-data.json khong hop le hoac khong co du lieu');
    }

    const users = buildUsersFromFakeData(parsed);
    if (users.length === 0) {
        throw new Error('Khong tao duoc nguoi dung hop le tu fake-data.json');
    }

    for (const user of users) {
        await User.upsert({
            id: user.id,
            fullName: user.fullName,
            role: user.role,
            email: user.email
        });
    }

    const fallbackManager = users.find((item) => item.role === 'MANAGER')
        || users.find((item) => item.role === 'LEADER')
        || users.find((item) => item.role === 'ADMIN')
        || users[0];

    const usersByDepartment = new Map();
    users.forEach((user) => {
        const list = usersByDepartment.get(user.departmentCode) || [];
        list.push(user);
        usersByDepartment.set(user.departmentCode, list);
    });

    const departments = [];
    usersByDepartment.forEach((members, departmentId) => {
        const manager = members.find((item) => item.role === 'MANAGER')
            || members.find((item) => item.role === 'LEADER')
            || members.find((item) => item.role === 'ADMIN')
            || fallbackManager;

        departments.push({
            id: departmentId,
            code: departmentId,
            name: members[0].departmentName,
            managerId: manager.id,
            managerName: manager.fullName
        });
    });

    for (const department of departments) {
        await Department.upsert(department);
    }

    await DepartmentMember.destroy({
        where: {
            userId: {
                [Op.in]: users.map((item) => item.id)
            }
        }
    });

    await DepartmentMember.bulkCreate(users.map((user) => ({
        departmentId: user.departmentCode,
        userId: user.id,
        role: user.role
    })));

    const deletedDemoDocs = await Document.destroy({
        where: {
            docNumber: {
                [Op.like]: 'LD-2026-%'
            }
        }
    });

    console.log(`âœ… Da dong bo ${users.length} nguoi dung tu fake-data.json`);
    console.log(`âœ… Da dong bo ${departments.length} phong ban va thanh vien phong ban`);
    if (deletedDemoDocs > 0) {
        console.log(`âœ… Da xoa ${deletedDemoDocs} van ban mau`);
    }
}


async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('âœ… Káº¿t ná»‘i DB thÃ nh cÃ´ng.');

        if (String(process.env.DB_SYNC || '').trim().toLowerCase() === 'true') {
            await sequelize.sync({ alter: true });
            console.log('✅ Database đã được đồng bộ hóa (DB_SYNC=true).');
        }

        // await seedInitialData();
        // console.log('âœ… ÄÃ£ náº¡p dá»¯ liá»‡u máº«u thÃ nh cÃ´ng.');

        app.listen(PORT, () => {
            console.log(`ðŸš€ Server cháº¡y táº¡i http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('âŒ Lá»—i khá»Ÿi Ä‘á»™ng:', err);
        process.exit(1);
    }
}
startServer();