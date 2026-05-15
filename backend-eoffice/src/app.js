const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/userRouter');
const documentRoutes = require('./routes/documentRouter');
const leaderRoutes = require('./routes/leaderRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const managerRoutes = require('./routes/managerRoutes');

const app = express();
app.use(cors());

// Middleware
app.use(express.json());

// Routes
app.use('/api', userRoutes);
app.use('/api', documentRoutes);
app.use('/api/leader', leaderRoutes);
app.use('/api', workflowRoutes);
app.use('/api/manager', managerRoutes);




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