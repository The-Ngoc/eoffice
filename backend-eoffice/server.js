require('dotenv').config();
const app = require('./src/app');

const db = require('./src/models');
const sequelize = db.sequelize;

const PORT = Number(process.env.PORT) || 3001;
const DB_SYNC = String(process.env.DB_SYNC || '').trim().toLowerCase() === 'true';
const DB_SYNC_ALTER = String(process.env.DB_SYNC_ALTER || '').trim().toLowerCase() === 'true';
const DB_SYNC_FORCE = String(process.env.DB_SYNC_FORCE || '').trim().toLowerCase() === 'true';

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        if (DB_SYNC) {
            await sequelize.sync({
                alter: DB_SYNC_ALTER,
                force: DB_SYNC_FORCE
            });
            console.log(
                `✅ Database đã được đồng bộ hóa (DB_SYNC=true, alter=${DB_SYNC_ALTER}, force=${DB_SYNC_FORCE}).`
            );
        }

        app.listen(PORT, () => {
            console.log(`server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Không thể khởi động server:', err);
        process.exit(1);
    }
}

startServer();
