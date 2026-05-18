const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/databaseConnection");

const Sales = sequelize.define("Sales", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },

  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },

  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },

  remainingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },

  status: {
    type: DataTypes.ENUM(
      "PAID",
      "PARTIAL",
      "DEBT",
      "RETURNED",
      "PARTIALLY_RETURNED",
    ),
    defaultValue: "PAID",
  },

  customerName: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  customerPhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  returnedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },

  returnedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  returnReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = Sales;
