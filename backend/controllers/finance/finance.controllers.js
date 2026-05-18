const { Op } = require("sequelize");
const { sequelize } = require("../../config/databaseConnection");
const { Sales, SaleItems, Products } = require("../../models");
const expenses_finance = require("../../models/expnses");

/* Helper: convert "yyyy-mm-dd" to local Date at 00:00:00 */
function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  return new Date(year, month - 1, day);
}

/* Helper: format Date as yyyy-mm-dd local */
function formatLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

exports.getFinanceSummary = async (req, res) => {
  try {
    const { period = "month", date } = req.query;
    const today = new Date();
    let startDate, endDate;

    // --- 1. Build date range (local time, no UTC shift) ---
    if (period === "day") {
      const parsedDay = date ? parseLocalDate(date) : new Date();
      startDate = new Date(
        parsedDay.getFullYear(),
        parsedDay.getMonth(),
        parsedDay.getDate(),
      );
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "month") {
      const [year, month] = date
        ? date.split("-")
        : [today.getFullYear(), today.getMonth() + 1];
      startDate = new Date(year, month - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // year
      const year = date ? parseInt(date) : today.getFullYear();
      startDate = new Date(year, 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(year, 11, 31);
      endDate.setHours(23, 59, 59, 999);
    }

    // --- 2. Net Revenue (from Sales table) ---
    const revenueResult = await Sales.findOne({
      attributes: [
        [
          sequelize.fn("SUM", sequelize.literal("totalPrice - returnedAmount")),
          "netRevenue",
        ],
      ],
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
        status: { [Op.ne]: "RETURNED" },
      },
      raw: true,
    });
    const netRevenue = parseFloat(revenueResult?.netRevenue) || 0;

    // --- 3. COGS (cost of sold items, considering returns) ---
    const cogsResult = await SaleItems.findAll({
      attributes: [
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              "(SaleItems.quantity - SaleItems.returnedQuantity) * Product.buyPrice",
            ),
          ),
          "totalCost",
        ],
      ],
      include: [
        {
          model: Products,
          attributes: [],
          required: true,
        },
        {
          model: Sales,
          attributes: [],
          required: true,
          where: {
            createdAt: { [Op.between]: [startDate, endDate] },
          },
        },
      ],
      raw: true,
    });

    const cogs = parseFloat(cogsResult[0]?.totalCost) || 0;

    // --- 4. Expenses ---
    const expensesTotal =
      (await expenses_finance.sum("value", {
        where: {
          date: { [Op.between]: [startDate, endDate] },
        },
      })) || 0;

    // --- 5. Recent expenses (for display) ---
    const recentExpenses = await expenses_finance.findAll({
      where: {
        date: { [Op.between]: [startDate, endDate] },
      },
      order: [["date", "DESC"]],
      limit: 10,
    });

    // --- 6. Final calculations ---
    const netProfit = netRevenue - cogs - expensesTotal;
    const profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    res.json({
      period,
      startDate,
      endDate,
      totalRevenue: netRevenue,
      totalExpenses: expensesTotal,
      cogs,
      netProfit,
      profitMargin: Math.round(profitMargin),
      breakdown: {
        productSales: netRevenue,
        cogs,
        otherExpenses: expensesTotal,
      },
      recentExpenses,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ statusCode: "500", Message: "حدث خطأ ما" });
  }
};
