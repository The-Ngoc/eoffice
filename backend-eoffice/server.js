require('dotenv').config();
const app = require('./src/app');

const db = require('./src/models');
const sequelize = db.sequelize;

const PORT = process.env.PORT;

async function startServer() {
    try {
        await sequelize.authenticate();

        if (String(process.env.DB_SYNC || '').trim().toLowerCase() === 'true') {
            await sequelize.sync({ alter: true });
            console.log('✅ Database đã được đồng bộ hóa (DB_SYNC=true).');
        }

        app.listen(PORT, () => {
            console.log(`server running on port ${PORT}`);
        });
    } catch (err) {
        console.error(':', err);
        process.exit(1);
    }
}
startServer();
