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
    departmentId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'department_id'
    },
    assigneeId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'assignee_id'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'parent_id'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    priority: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM(Object.values(TASK_STATUS)),
        allowNull: false,
        defaultValue: TASK_STATUS.TODO
    },
    priority: {
        type: DataTypes.ENUM(Object.values(PRIORITY)),
        allowNull: true,
        defaultValue: PRIORITY.MEDIUM
    },
    dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'due_date'
    },
    createdBy: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'created_by'
    },
    sender: {
        type: DataTypes.STRING,
        allowNull: true
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

    Task.belongsTo(models.Department, {
        foreignKey: 'departmentId',
        as: 'department'
    });

    Task.belongsTo(models.User, {
        foreignKey: 'assigneeId',
        as: 'assignee'
    });

    Task.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
    });

    Task.belongsTo(models.Task, {
        foreignKey: 'parentId',
        as: 'parentTask',
        constraints: false
    });

    Task.hasMany(models.Task, {
        foreignKey: 'parentId',
        as: 'subTasks',
        constraints: false
    });
};

module.exports = Task;