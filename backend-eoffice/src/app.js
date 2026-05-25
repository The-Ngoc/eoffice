const express = require('express');
const cors = require('cors');
const db = require('./models');

const userRoutes = require('./routes/userRouter');
const documentRoutes = require('./routes/documentRouter');
const leaderRoutes = require('./routes/leaderRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const managerRoutes = require('./routes/managerRoutes');
const specialistRoutes = require('./routes/specialistRoutes');
const cloudinaryRoutes = require('./routes/cloudinaryRoutes');
const departmentMemberRoutes = require('./routes/departmentMemberRoutes');
const taskRoutes = require('./routes/taskRoutes');


const app = express();
app.use(cors());

// Middleware
app.use(express.json());

//  Khởi tạo database và đồng bộ các model với database


async function initializeDatabase() {
    try {
        await db.sequelize.sync({ alter: true });
        console.log('✅ Tất cả bảng đã được tạo/cập nhật thành công');
    } catch (error) {
        console.error('❌ Lỗi khi khởi tạo database:', error.message);
        process.exit(1);
    }
}

// initializeDatabase();

// Routes
app.use('/api', userRoutes);
app.use('/api', documentRoutes);
app.use('/api/leader', leaderRoutes);
app.use('/api', workflowRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/specialist', specialistRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);

app.use('/api', departmentMemberRoutes);
app.use('/api', taskRoutes);




// Middleware xử lý lỗi tập trung
app.use((err, req, res, next) => {
    const statusCode = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
    console.error('🔥 BACKEND ERROR:', err?.stack || err);

    return res.status(statusCode).json({
        success: false,
        data: null,
        message: err.message || 'Internal Server Error'
    });
});

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        data: null,
        message: 'Route not found'
    });
});




module.exports = app;
