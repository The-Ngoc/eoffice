const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DepartmentMember = sequelize.define('DepartmentMember', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    departmentId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'department_id'
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'user_id'
    }
}, {
    tableName: 'department_members',
    timestamps: true
});

DepartmentMember.associate = (models) => {
    DepartmentMember.belongsTo(models.Department, {
        foreignKey: 'departmentId',
        as: 'department'
    });

    DepartmentMember.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
    });
};

module.exports = DepartmentMember;
