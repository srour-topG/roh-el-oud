const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/databaseConnection");
const Users = sequelize.define("Users", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
  username: {
    type: DataTypes.STRING,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
  role: {
    type: DataTypes.STRING,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  salary: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  qualification: {
    type: DataTypes.TEXT,
    allowNull: false,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
  hiringDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  status: {
    type: DataTypes.STRING,
    defaultValue: "active",
    allowNull: false,
  },
});

module.exports = Users;
