const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { ROLES } = require('../constants/enums');

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
        type: DataTypes.ENUM(Object.values(ROLES)), 
        defaultValue: ROLES.SPECIALIST 
    },
    email: { 
        type: DataTypes.STRING, 
        allowNull: false,
    }
}, {
    timestamps: true,
    tableName: 'users' 
});

User.associate = (models) => {
    User.hasMany(models.Department, {
        foreignKey: 'managerId',
        as: 'managedDepartments'
    });

    User.hasMany(models.DepartmentMember, {
        foreignKey: 'userId',
        as: 'departmentMemberships'
    });

    User.hasMany(models.DocumentFlow, {
        foreignKey: 'managerId',
        as: 'handledFlows'
    });

    User.hasMany(models.Task, {
        foreignKey: 'assigneeId',
        as: 'assignedTasks'
    });

    User.hasMany(models.Task, {
        foreignKey: 'createdBy',
        as: 'createdTasks'
    });

    User.hasMany(models.Signature, {
        foreignKey: 'signerId',
        as: 'signatures'
    });
};

module.exports = User;