const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { DOCUMENT_STATUS, PRIORITY, DOCUMENT_DIRECTION } = require('../constants/enums');

const Document = sequelize.define('Document', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    docNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    symbol: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sender: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'start_time'
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'end_time'
    },
    status: {
        type: DataTypes.ENUM(Object.values(DOCUMENT_STATUS)),
        allowNull: false,
        defaultValue: DOCUMENT_STATUS.DRAFT
    },
    urgency: {
        type: DataTypes.ENUM('Thường', 'Khẩn', 'Hỏa tốc'),
        allowNull: false,
        defaultValue: 'Thường'
    },
    priority: {
        type: DataTypes.ENUM(Object.values(PRIORITY)),
        allowNull: true
    },
    direction: {
        type: DataTypes.ENUM(Object.values(DOCUMENT_DIRECTION)),
        allowNull: true,
        defaultValue: DOCUMENT_DIRECTION.INBOUND
    },
    arrivalDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    priority: {
        type: DataTypes.STRING,
        allowNull: true
    },
    summary: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    legalWarnings: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'legal_warnings'
    },
    attachments: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rejectReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'reject_reason'
    },
    assignedDepartmentId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'assigned_department_id'
    },
    isOverdue: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    flow: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    }
}, {
    tableName: 'documents',
    timestamps: true
});

Document.associate = (models) => {
    Document.belongsTo(models.Department, {
        foreignKey: 'assignedDepartmentId',
        as: 'assignedDepartment'
    });

    Document.hasMany(models.DocumentFlow, {
        foreignKey: 'documentId',
        as: 'flowHistories'
    });

    Document.hasMany(models.Task, {
        foreignKey: 'documentId',
        as: 'tasks'
    });

    Document.hasMany(models.Signature, {
        foreignKey: 'documentId',
        as: 'signatures'
    });
};

module.exports = Document;
