const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { SIGNATURE_STATUS } = require('../constants/enums');

const Signature = sequelize.define('Signature', {
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
    status: {
        type: DataTypes.ENUM(Object.values(SIGNATURE_STATUS)),
        allowNull: false,
        defaultValue: SIGNATURE_STATUS.PENDING
    },
    certificateSerial: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'certificate_serial'
    },
    signatureHash: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'signature_hash'
    },
    provider: {
        type: DataTypes.STRING,
        allowNull: true
    },
    signOrder: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'sign_order'
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
    tableName: 'signatures',
    timestamps: true
});

Signature.associate = (models) => {
    Signature.belongsTo(models.Document, {
        foreignKey: 'documentId',
        as: 'document'
    });

    Signature.belongsTo(models.User, {
        foreignKey: 'signerId',
        as: 'signer'
    });
};

module.exports = Signature;