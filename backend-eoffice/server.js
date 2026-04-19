require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/db');
const User = require('./src/model/userModel'); // Import để Sequelize biết có Model này

const PORT = process.env.PORT ;



async function startServer() {
    try {
        // Kiểm tra kết nối
        await sequelize.authenticate();
        console.log('✅ Kết nối DB thành công.');

        // Đồng bộ Model thành Table
        // alter: true giúp cập nhật bảng nếu bạn thêm bớt cột sau này
        await sequelize.sync({ alter: true });
        console.log('✅ Database đã được đồng bộ hóa.');

        app.listen(PORT, () => {
            console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Lỗi khởi động:', err);
    }
}

startServer();