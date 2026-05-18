const Products = require("./product.models");
const StockMovements = require("./stockMovement.models");
const Indebtedness = require("./indebtedness.model");
const Categories = require("./category.models");
const Sales = require("./sale.model");
const SaleItems = require("./saleItems.model");


Products.hasMany(StockMovements, { foreignKey: "productID" });
StockMovements.belongsTo(Products, { foreignKey: "productID" });

Products.belongsTo(Categories, {
  foreignKey: "categoryId",
  as: "category",
});

Categories.hasMany(Products, {
  foreignKey: "categoryId",
});


// sales
Sales.hasMany(SaleItems, {
  foreignKey: "saleId",
});

SaleItems.belongsTo(Sales, {
  foreignKey: "saleId",
});

Products.hasMany(SaleItems, {
  foreignKey: "productId",
});

SaleItems.belongsTo(Products, {
  foreignKey: "productId",
});



module.exports = {
  Indebtedness,
  Products,
  Categories,
  StockMovements,
  Sales,
  SaleItems,
};
