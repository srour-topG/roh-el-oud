const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/databaseConnection");

const expenses_finance = sequelize.define("expenses_finance", {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  value: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
});

module.exports = expenses_finance;
