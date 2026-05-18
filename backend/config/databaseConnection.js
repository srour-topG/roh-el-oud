const path = require("path");
const dotenv = require("dotenv");
require("dotenv").config({ path: "./.env" });
console.log(
  "ENV loaded:",
  process.env.DB_USER,
  process.env.DATABASE,
  process.env.PASSWORD,
);

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.DB_USER,
  process.env.PASSWORD,
  {
    host: "localhost",
    port: 3306,

    dialect: "mysql",
    timezone: "+03:00",
    // logging: false,

    // charset: "utf8mb4",
    // collate: "utf8mb4_unicode_ci",
    // dialectOptions: {
    //   charset: "utf8mb4",
    // },

    pool: {
      max: 10,
      min: 1,
      acquire: 30000,
      idle: 10000,
    },

    logging: true,
  },
);

const databaseConnection = sequelize
  .authenticate()
  .then(() => console.log("✅ Database connected!"))
  .catch((err) => console.error("❌ Unable to connect to the database:", err));

sequelize
  .sync({ alter: true })
  .then((result) => {
    (console.log(process.env.DATABASE),
      console.log(process.env.PASSWORD),
      console.log(process.env.DB_USER));
  })
  .catch((e) => {
    console.log("❌ Sync error:", e);
  });

module.exports = { sequelize, databaseConnection };
