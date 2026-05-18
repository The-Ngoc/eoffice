const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TaskFile = sequelize.define('TaskFile', {
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
    nameFile: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'name_file'
    },
    url: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'task_files',
    timestamps: true
});

TaskFile.associate = (models) => {
    TaskFile.belongsTo(models.Task, {
        foreignKey: 'taskId',
        as: 'task'
    });
};

module.exports = TaskFile;
