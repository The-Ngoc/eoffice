const { Sequelize } = require('sequelize');
require('dotenv').config();
let sequelize;

// Nếu có DATABASE_URL (ví dụ Render cung cấp), dùng chuỗi kết nối này.
// Ngược lại fallback về biến DB_* (host/user/password/name/port).
if (process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim() !== '') {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
            // Một số managed MySQL yêu cầu kết nối SSL; cho phép tùy chỉnh khi cần.
            ssl: {
                rejectUnauthorized: false
            }
        }
    });
} else {
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
            dialect: 'mysql',
            logging: false
        }
    );
}

module.exports = sequelize;