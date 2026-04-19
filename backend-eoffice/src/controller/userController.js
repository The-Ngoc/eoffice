const fs = require('fs');
const path = require('path');

const User = require('../model/userModel');


exports.getMeByID = async (req, res) => {
    try {
        const { id } = req.params; 
        const user = await User.findByPk(id, {
            attributes: ['id', 'fullName', 'role']
        });

        return res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error("❌ Lỗi khi lấy User theo ID:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi hệ thống khi truy vấn Database" 
        });
    }
};

exports.addUser = async (req, res) => {
    try {
        const { id, fullName, role, email } = req.body;
        const newUser = await User.create({ id, fullName, role, email });
        return res.status(201).json({
            success: true,
            data: newUser
        });
    } catch (error) {
        console.error("❌ Lỗi khi thêm User:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống khi thêm User vào Database"
        });
    }
};
