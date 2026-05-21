const Categories = require("./category.models");
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/databaseConnection");

const Products = sequelize.define(
  "Products",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    sellPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    buyPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    storeQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    minQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
    barcode: { type: DataTypes.STRING, allowNull: true },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "categories",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    image: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "products",
  },
);

module.exports = Products;
