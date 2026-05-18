const {Router} = require("express")

const router = Router()

const {expenses, getExpenses, deleteExpenses} = require("../../controllers/expenses/expenses.controllers")

router.post("/api/expenses",expenses)
router.get("/api/expenses",getExpenses)

router.delete("/api/expenses/:id",deleteExpenses)

module.exports = router