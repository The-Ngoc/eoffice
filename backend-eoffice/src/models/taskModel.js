const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { TASK_STATUS, PRIORITY } = require('../constants/enums');

const Task = sequelize.define('Task', {
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
    memberId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'member_id'
    },
    assignerId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'assigner_id'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM(Object.values(TASK_STATUS)),
        allowNull: false,
        defaultValue: TASK_STATUS.TODO
    },
    progress: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    priority: {
        type: DataTypes.ENUM(Object.values(PRIORITY)),
        allowNull: true,
        defaultValue: PRIORITY.MEDIUM
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'due_date'
    },
    isOverdue: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_overdue'
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'rejection_reason'
    }
}, {
    tableName: 'tasks',
    timestamps: true
});

Task.associate = (models) => {
    Task.belongsTo(models.Document, {
        foreignKey: 'documentId',
        as: 'document'
    });

    Task.belongsTo(models.DepartmentMember, {
        foreignKey: 'memberId',
        as: 'member'
    });

    Task.belongsTo(models.User, {
        foreignKey: 'assignerId',
        as: 'assigner'
    });

    Task.hasMany(models.TaskFile, {
        foreignKey: 'taskId',
        as: 'files'
    });
};

module.exports = Task;
