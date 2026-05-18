const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DocumentFile = sequelize.define('DocumentFile', {
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
    tableName: 'document_files',
    timestamps: true
});

DocumentFile.associate = (models) => {
    DocumentFile.belongsTo(models.Document, {
        foreignKey: 'documentId',
        as: 'document'
    });
};

module.exports = DocumentFile;
