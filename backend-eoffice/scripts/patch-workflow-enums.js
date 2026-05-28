const sequelize = require('../src/config/db');

async function patchWorkflowEnums() {
    await sequelize.authenticate();

    await sequelize.query(`
        ALTER TABLE documents
        MODIFY status ENUM('DRAFT','PENDING_LEADER','APPROVED','ASSIGNED','PROCESSING','COMPLETED','PUBLISHED','REJECTED')
        NOT NULL DEFAULT 'DRAFT'
    `);

    await sequelize.query(`
        ALTER TABLE tasks
        MODIFY status ENUM('TODO','DOING','WAITING_APPROVAL','REJECTED','DONE','OVERDUE')
        NOT NULL DEFAULT 'TODO'
    `);

    console.log('✅ Patched workflow ENUM values for documents.status and tasks.status');
}

patchWorkflowEnums()
    .catch((error) => {
        console.error('❌ Failed to patch workflow ENUM values:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sequelize.close();
    });
