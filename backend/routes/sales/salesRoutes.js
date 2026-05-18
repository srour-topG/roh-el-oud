const router = require("express").Router();

const { createSale , getSales , getSaleDetails , returnSaleItems, getCashierRevenue} = require("../../controllers/sales/sales.controllers");

router.post("/api/sales", createSale);
router.get("/api/sales",getSales);
router.get("/api/sales/:id", getSaleDetails);
router.post("/api/sales/:id/return", returnSaleItems);

module.exports = router;
