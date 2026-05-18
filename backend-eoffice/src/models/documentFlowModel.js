const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DocumentFlow = sequelize.define('DocumentFlow', {
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
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'PENDING'
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    processedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'processed_at'
    }
}, {
    tableName: 'document_flow_history',
    timestamps: true
});

DocumentFlow.associate = (models) => {
    DocumentFlow.belongsTo(models.Document, {
        foreignKey: 'documentId',
        as: 'document'
    });

    DocumentFlow.belongsTo(models.Department, {
        foreignKey: 'departmentId',
        as: 'department'
    });
};

module.exports = DocumentFlow;