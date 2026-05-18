const { Op } = require("sequelize");
const { sequelize } = require("../../config/databaseConnection");
const Indebtedness = require("../../models/indebtedness.model");
const { DateNow } = require("../../utils/date");

/* ─────────────────────────────────────────────
   GET ALL DEBTS  (paginated, filterable)
   GET /debts?status=pending&search=ahmed&page=1
───────────────────────────────────────────── */
exports.getAllDebts = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    // status filter
    if (status && status !== "all") {
      where.status = status;
    }

    // search
    if (search && search.trim()) {
      where[Op.or] = [
        {
          customerName: {
            [Op.like]: `%${search.trim()}%`,
          },
        },

        {
          customerPhone: {
            [Op.like]: `%${search.trim()}%`,
          },
        },

        {
          invoiceNumber: {
            [Op.like]: `%${search.trim()}%`,
          },
        },
      ];
    }

    const { rows, count } = await Indebtedness.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    // stats
    const totalDebt =
      (await Indebtedness.sum("remainingAmount", {
        where: {
          status: {
            [Op.in]: ["pending", "partial"],
          },
        },
      })) || 0;

    const pendingCount = await Indebtedness.count({
      where: { status: "pending" },
    });

    const partialCount = await Indebtedness.count({
      where: { status: "partial" },
    });

    const paidCount = await Indebtedness.count({
      where: { status: "paid" },
    });

    res.json({
      debts: rows,

      currentPage: parseInt(page),

      totalPages: Math.ceil(count / parseInt(limit)),

      totalItems: count,

      stats: {
        totalDebt,
        pendingCount,
        partialCount,
        paidCount,
      },
    });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      Message: "حدث خطأ ما",
    });
  }
};


/* ─────────────────────────────────────────────
   pay debt -- > no need to delete
───────────────────────────────────────────── */
exports.payDebt = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { amount } = req.body;

    const payAmount = parseFloat(amount);

    if (!payAmount || isNaN(payAmount) || payAmount <= 0) {
      await t.rollback();

      return res.status(400).json({
        Message: "مبلغ غير صالح",
      });
    }

    const debt = await Indebtedness.findByPk(id, {
      transaction: t,
    });

    if (!debt) {
      await t.rollback();

      return res.status(404).json({
        Message: "الدين غير موجود",
      });
    }

    if (debt.status === "paid") {
      await t.rollback();

      return res.status(400).json({
        Message: "تم سداد هذا الدين بالفعل",
      });
    }

    const remaining = parseFloat(debt.remainingAmount);
    const actualPay = Math.min(payAmount, remaining);
    const newPaid = parseFloat(debt.paidAmount) + actualPay;
    const newRemaining = remaining - actualPay;
    const newStatus = newRemaining <= 0 ? "paid" : "partial";

    await debt.update(
      {
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newStatus,
      },
      { transaction: t },
    );


    const Sales = require("../../models/sale.model");

    const sale = await Sales.findOne({
      where: {
        invoiceNumber: debt.invoiceNumber,
      },
      transaction: t,
    });

    if (sale) {
      await sale.update(
        {
          paidAmount: newPaid,
          remainingAmount: newRemaining,

          status: newRemaining <= 0 ? "PAID" : "PARTIAL",
        },
        { transaction: t },
      );
    }

    await t.commit();

    res.json({
      Message: "تم تسجيل الدفعة بنجاح",

      paidAmount: actualPay,

      remainingAmount: newRemaining,

      status: newStatus,
    });
  } catch (e) {
    await t.rollback();

    console.log(e);

    res.status(500).json({
      Message: "حدث خطأ ما",
    });
  }
};

/* ─────────────────────────────────────────────
   DELETE DEBT  (admin write-off)
   DELETE /debts/:id
───────────────────────────────────────────── */
exports.deleteDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Indebtedness.destroy({ where: { id } });
    if (!result)
      return res.status(404).json({ statusCode: "404", Message: "غير موجود" });
    res.json({ statusCode: "200", Message: "تم الحذف" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ statusCode: "500", Message: "حدث خطأ ما" });
  }
};


exports.createDebt = async (req, res) => {
  try {
    const debt = await Indebtedness.create(req.body);

    res.status(201).json({
      Message: "تم إنشاء الدين",
      debt,
    });
  } catch (e) {
    console.log(e);

    res.status(500).json({
      Message: "حدث خطأ ما",
    });
  }
};
