const { Router } = require("express");

const router = Router();

const {
  getFinanceSummary,
} = require("../../controllers/finance/finance.controllers");

router.get("/api/finance/summary", getFinanceSummary);

module.exports = router;
