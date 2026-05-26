'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);

// Dùng chung sequelize instance từ src/config/db.js để tránh cấu hình chồng chéo
const sequelize = require('../config/db');
const db = {};

// --- ĐOẠN QUÉT MODEL DƯỚI ĐÂY GIỮ NGUYÊN THEO CODE CŨ CỦA BẠN ---
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file));

    if (model && typeof model === 'object' && model.name) {
      db[model.name] = model;
    }
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;