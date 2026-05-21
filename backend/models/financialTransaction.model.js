const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/databaseConnection");

const FinancialTransaction = sequelize.define(
  "FinancialTransaction",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    type: {
      type: DataTypes.ENUM(
        "SALE",
        "DEBT_PAYMENT",
        "RETURN",
        "EXPENSE",
        "WITHDRAW",
        "OPENING_BALANCE",
      ),
      allowNull: false,
    },

    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    paymentMethod: {
      type: DataTypes.STRING,
      defaultValue: "cash",
    },

    sourceType: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    sourceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "financial_transactions",
  },
);

module.exports = FinancialTransaction;
