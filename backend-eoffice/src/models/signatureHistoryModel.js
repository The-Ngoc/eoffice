const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SignatureHistory = sequelize.define('SignatureHistory', {
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
    signerId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'signer_id'
    },
    signedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'signed_at'
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'signature_history',
    timestamps: true
});

SignatureHistory.associate = (models) => {
    SignatureHistory.belongsTo(models.Document, {
        foreignKey: 'documentId',
        as: 'document'
    });

    SignatureHistory.belongsTo(models.User, {
        foreignKey: 'signerId',
        as: 'signer'
    });
};

module.exports = SignatureHistory;
