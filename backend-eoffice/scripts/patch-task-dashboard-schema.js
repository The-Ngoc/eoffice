require('dotenv').config();

const sequelize = require('../src/config/db');

async function getIndexes(tableName) {
    const [rows] = await sequelize.query(
        `
        SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :tableName
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
        `,
        { replacements: { tableName } }
    );

    return rows;
}

async function dropDuplicateDepartmentCodeIndexes() {
    const indexes = await getIndexes('departments');
    const codeIndexes = indexes
        .filter((row) => row.COLUMN_NAME === 'code' && Number(row.NON_UNIQUE) === 0)
        .map((row) => row.INDEX_NAME)
        .filter((name) => name !== 'PRIMARY');

    const [keepIndex, ...duplicateIndexes] = [...new Set(codeIndexes)];

    if (!keepIndex || duplicateIndexes.length === 0) {
        console.log('No duplicate departments.code indexes found.');
        return;
    }

    for (const indexName of duplicateIndexes) {
        await sequelize.query(`ALTER TABLE departments DROP INDEX \`${indexName}\``);
        console.log(`Dropped duplicate index departments.${indexName}`);
    }
}

async function addColumnIfMissing(tableName, columnName, definition) {
    const [rows] = await sequelize.query(
        `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :tableName
          AND COLUMN_NAME = :columnName
        `,
        { replacements: { tableName, columnName } }
    );

    if (rows.length > 0) {
        console.log(`Column ${tableName}.${columnName} already exists.`);
        return;
    }

    await sequelize.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
    console.log(`Added column ${tableName}.${columnName}`);
}

async function createTaskHistoryIfMissing() {
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS task_history (
            id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
            task_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            type ENUM('PROGRESS', 'COMMENT', 'SUBMISSION', 'RESUBMISSION', 'REJECT') NOT NULL DEFAULT 'COMMENT',
            progress INT DEFAULT NULL,
            content TEXT DEFAULT NULL,
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME NOT NULL,
            PRIMARY KEY (id),
            KEY task_history_task_id (task_id),
            KEY task_history_user_id (user_id),
            CONSTRAINT task_history_task_fk FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT task_history_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    console.log('Ensured table task_history exists.');
}

async function addRejectedTaskStatusIfMissing() {
    const [rows] = await sequelize.query(`
        SELECT COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'tasks'
          AND COLUMN_NAME = 'status'
    `);

    const columnType = rows[0]?.COLUMN_TYPE || '';
    if (columnType.includes("'REJECTED'")) {
        console.log('tasks.status already supports REJECTED.');
        return;
    }

    await sequelize.query(`
        ALTER TABLE tasks
        MODIFY status ENUM('TODO','DOING','WAITING_APPROVAL','REJECTED','DONE','OVERDUE') NOT NULL DEFAULT 'TODO'
    `);

    console.log('Added REJECTED to tasks.status enum.');
}

async function main() {
    try {
        await sequelize.authenticate();
        await dropDuplicateDepartmentCodeIndexes();
        await addColumnIfMissing('tasks', 'progress', 'INT NOT NULL DEFAULT 0');
        await addColumnIfMissing('tasks', 'rejection_reason', 'TEXT DEFAULT NULL');
        await addRejectedTaskStatusIfMissing();
        await createTaskHistoryIfMissing();
        console.log('Task dashboard schema patch completed.');
    } finally {
        await sequelize.close();
    }
}

main().catch((error) => {
    console.error('Task dashboard schema patch failed:', error);
    process.exit(1);
});

