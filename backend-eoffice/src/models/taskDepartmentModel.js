const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TaskDepartment = sequelize.define('TaskDepartment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    documentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'document_id'
    },
    managerId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'manager_id'
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'task_departments',
    timestamps: true,
    indexes: [
        {
            fields: ['document_id']
        },
        {
            fields: ['manager_id']
        },
        {
            fields: ['createdAt']
        },
        {
            unique: true,
            fields: ['document_id', 'manager_id']
        }
    ]
});

TaskDepartment.associate = (models) => {
    TaskDepartment.belongsTo(models.Document, {
        foreignKey: 'documentId',
        as: 'document'
    });

    TaskDepartment.belongsTo(models.User, {
        foreignKey: 'managerId',
        targetKey: 'id',
        as: 'manager'
    });

    TaskDepartment.belongsTo(models.Department, {
        foreignKey: 'managerId',
        targetKey: 'managerId',
        as: 'department'
    });
};

module.exports = TaskDepartment;
