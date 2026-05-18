const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/databaseConnection");

const Categories = sequelize.define(
  "Categories",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
  },
  {
    tableName: "categories",
  },
);

module.exports = Categories;
