const express = require("express");
const {
  databaseConnection,
  sequelize,
} = require("./config/databaseConnection");
const cors = require("cors");
const app = express();
const cookieParse = require("cookie-parser");
const { decryptFile } = require("./utils/crypto");

const path = require("path");
const fs = require("fs");

app.use(cookieParse());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
databaseConnection;

// routes

const usersRoutes = require("./routes/users/usersRoutes");
const financeRoute = require("./routes/finance/financeRoutes");
const expensesRoutes = require("./routes/expenses/expensesRoutes");
const productsRouter = require("./routes/products/productsRoutes");
const debtRoutes = require("./routes/finance/debtRoutes");
const categoriesRoutes = require("./routes/categories/categoriesRoutes");
const salesRoutes = require("./routes/sales/salesRoutes");

// models
require("./models/users.models");
require("./models/expnses");
require("./models/category.models");
require("./models/sale.model");
require("./models/saleItems.model");
require("./models");

// app.use(express.static(path.join(__dirname, 'dist')));

// // For any route not handled by your backend, serve React's index.html
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'dist', 'index.html'));
// });

app.use(usersRoutes);
app.use(financeRoute);
app.use(expensesRoutes);
app.use(productsRouter);
app.use(debtRoutes);
app.use(categoriesRoutes);
app.use(salesRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// running html indide backend locally <3
app.use(express.static(path.join(__dirname, "dist")));
app.get("/{*any}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = 6060;
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
