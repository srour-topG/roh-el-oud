const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  stockMovement,
  getMovements,
  getAnalytics,
  sellProduct,
  upload,
  storeTransfer,
} = require("../../controllers/products/productsController");

// Analytics & movements
router.get("/api/products/analytics", getAnalytics);
router.get("/api/products/stock/movements", getMovements);

// CRUD
router.get("/api/products", getProducts);
router.get("/api/products/:id", getProduct);
router.post("/api/products", upload.single("image"), addProduct);
router.patch("/api/products/:id", upload.single("image"), updateProduct);
router.delete("/api/products/:id", deleteProduct);

// Stock & sell
router.post("/api/products/stock", stockMovement);
router.post("/api/products/sell", sellProduct);
router.post("/api/products/store-transfer", storeTransfer);

module.exports = router;
