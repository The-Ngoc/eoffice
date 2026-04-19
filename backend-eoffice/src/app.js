const express = require('express');
const routes = require('./routes/userRouter'); 
const cors = require('cors');

const app = express();
app.use(cors());

// Middleware
app.use(express.json());

// Routes
app.use('/api', routes);

// Thêm đoạn này để debug xem Route có thực sự tồn tại không
console.log("--- DANH SÁCH ROUTE ĐÃ ĐĂNG KÝ ---");
routes.stack.forEach((r) => {
    if (r.route) {
        console.log(`Kiểm tra: GET /api${r.route.path}`);
    }
});
console.log("---------------------------------");

// Middleware xử lý lỗi tập trung (Optionally)
app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});



module.exports = app;