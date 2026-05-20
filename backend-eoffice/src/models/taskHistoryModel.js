const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TaskHistory = sequelize.define('TaskHistory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    taskId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'task_id'
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'user_id'
    },
    type: {
        type: DataTypes.ENUM('PROGRESS', 'COMMENT', 'SUBMISSION', 'RESUBMISSION', 'REJECT'),
        allowNull: false,
        defaultValue: 'COMMENT'
    },
    progress: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'task_history',
    timestamps: true
});

TaskHistory.associate = (models) => {
    TaskHistory.belongsTo(models.Task, {
        foreignKey: 'taskId',
        as: 'task'
    });

    TaskHistory.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
    });
};

module.exports = TaskHistory;

