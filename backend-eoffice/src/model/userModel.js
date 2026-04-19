const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    fullName: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    role: { 
        type: DataTypes.ENUM('ADMIN', 'CLERICAL', 'LEADER', 'MANAGER', 'SPECIALIST'), 
        defaultValue: 'SPECIALIST' 
    },
    email: { 
        type: DataTypes.STRING, 
        allowNull: false,
    }
}, {
    timestamps: true,
    tableName: 'users' 
});

module.exports = User;