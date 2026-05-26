'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);

// 1. Xác định môi trường hiện tại (Render gán NODE_ENV = production)
const env = process.env.NODE_ENV || 'development';

// 2. Trỏ đúng đường dẫn tới file config.json ở ngoài thư mục gốc
const config = require(path.resolve('config', 'config.json'))[env];
const db = {};

let sequelize;

// 3. Nếu môi trường có cấu hình use_env_variable (như khối production ta đã làm)
if (config && config.use_env_variable) {
  // Bốc chuỗi connection từ biến DATABASE_URL trên Render
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // Dùng cho máy local (development)
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

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