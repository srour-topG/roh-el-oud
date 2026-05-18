const { Router } = require("express");
const {
  getAllDebts,
  payDebt,
  deleteDebt,
  createDebt,
} = require("../../controllers/finance/debt.controllers");

const router = Router();

router.get("/api/debts", getAllDebts);
router.post("/api/debts/:id/pay", payDebt);
router.delete("/api/debts/:id", deleteDebt);
router.post("/api/debts", createDebt);

module.exports = router;
