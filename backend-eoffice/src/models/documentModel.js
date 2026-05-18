const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { DOCUMENT_STATUS, PRIORITY } = require('../constants/enums');

const Document = sequelize.define('Document', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    documentNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'document_number'
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
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    summary: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Cảnh báo pháp lý (kiểu boolean): true = có cảnh báo, false = không có cảnh báo
    legalWarning: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        field: 'legal_warning'
    }
}, {
    tableName: 'documents',
    timestamps: true
});

Document.associate = (models) => {
    Document.hasMany(models.DocumentFlow, {
        foreignKey: 'documentId',
        as: 'flowHistories'
    });

    Document.hasMany(models.Task, {
        foreignKey: 'documentId',
        as: 'tasks'
    });

    Document.hasMany(models.DocumentFile, {
        foreignKey: 'documentId',
        as: 'files'
    });

    Document.hasMany(models.SignatureHistory, {
        foreignKey: 'documentId',
        as: 'signatureHistories'
    });
};

module.exports = Document;
