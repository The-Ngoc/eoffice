const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Department = sequelize.define('Department', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    managerId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'manager_id'
    },
    managerName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'manager_name'
    }
}, {
    tableName: 'departments',
    timestamps: true
});

Department.associate = (models) => {
    Department.belongsTo(models.User, {
        foreignKey: 'managerId',
        as: 'manager'
    });

    Department.hasMany(models.DepartmentMember, {
        foreignKey: 'departmentId',
        as: 'members'
    });

    Department.hasMany(models.Document, {
        foreignKey: 'assignedDepartmentId',
        as: 'assignedDocuments'
    });

    Department.hasMany(models.DocumentFlow, {
        foreignKey: 'departmentId',
        as: 'flowHistories'
    });

    Department.hasMany(models.Task, {
        foreignKey: 'departmentId',
        as: 'tasks'
    });
};

module.exports = Department;
