const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/databaseConnection");

const StockMovements = sequelize.define("StockMovements", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productID: { type: DataTypes.INTEGER, allowNull: false },
  type: {
    type: DataTypes.ENUM("add", "remove","returned"),
    allowNull: false,
  },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  quantityAfter: { type: DataTypes.INTEGER, allowNull: false },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
  date: { type: DataTypes.DATE, allowNull: false },
});

module.exports = StockMovements;
