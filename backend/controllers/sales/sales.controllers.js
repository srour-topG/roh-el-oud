const { Op } = require("sequelize");
const { sequelize } = require("../../config/databaseConnection");

const {
  Sales,
  SaleItems,
  Products,
  Indebtedness,
  StockMovements,
  FinancialTransaction,
} = require("../../models");

const { DateNow } = require("../../utils/date");

exports.createSale = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      invoiceNumber,
      items,
      totalPrice,
      discount = 0,
      paidAmount = 0,
      remainingAmount = 0,
      status = "PAID",
      customerName = null,
      customerPhone = null,
    } = req.body;

    /* ─────────────────────────────
       VALIDATION
    ───────────────────────────── */

    if (!invoiceNumber) {
      await t.rollback();

      return res.status(400).json({
        Message: "رقم الفاتورة مطلوب",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      await t.rollback();

      return res.status(400).json({
        Message: "السلة فارغة",
      });
    }

    // CHECK DUPLICATE INVOICE
    const existingSale = await Sales.findOne({
      where: { invoiceNumber },
      transaction: t,
    });

    if (existingSale) {
      await t.rollback();

      return res.status(400).json({
        Message: "رقم الفاتورة موجود بالفعل",
      });
    }

    /* ─────────────────────────────
       CREATE SALE
    ───────────────────────────── */

    const sale = await Sales.create(
      {
        invoiceNumber,
        totalPrice,
        discount,
        paidAmount,
        remainingAmount,
        status,
        customerName,
        customerPhone,
      },
      { transaction: t },
    );

    if (paidAmount > 0) {
      await FinancialTransaction.create(
        {
          type: "SALE",
          invoiceNumber,
          amount: paidAmount,
          sourceType: "SALE",
          sourceId: sale.id,
          notes: `دفع فاتورة ${invoiceNumber}`,
          date: DateNow(),
        },
        { transaction: t },
      );
    }

    const saleItemsData = [];
    const stockMovementsData = [];

    /* ─────────────────────────────
       HANDLE ITEMS
    ───────────────────────────── */

    for (const item of items) {
      const quantity = parseInt(item.quantity);
      const price = parseFloat(item.price);

      if (!quantity || quantity <= 0) {
        await t.rollback();

        return res.status(400).json({
          Message: "كمية غير صالحة",
        });
      }

      const product = await Products.findByPk(item.productId, {
        transaction: t,
        lock: true,
      });

      if (!product) {
        await t.rollback();

        return res.status(404).json({
          Message: "منتج غير موجود",
        });
      }

      if (product.storeQuantity < quantity) {
        await t.rollback();

        return res.status(400).json({
          Message: `${product.name} الكمية غير متوفرة في المحل`,
        });
      }

      // SALE ITEM
      saleItemsData.push({
        saleId: sale.id,
        productId: product.id,
        quantity,
        returnedQuantity: 0,
        price,
        totalPrice: quantity * price,
      });

      // STOCK MOVEMENT
      stockMovementsData.push({
        productID: product.id,
        type: "remove",
        quantity,
        unitPrice: price,
        date: DateNow(),
        notes: "بيع كاشير",
      });

      // UPDATE PRODUCT STOCK
      await product.update(
        {
          storeQuantity: product.storeQuantity - quantity,
        },
        { transaction: t },
      );
    }

    /* ─────────────────────────────
       BULK CREATE ITEMS
    ───────────────────────────── */

    await SaleItems.bulkCreate(saleItemsData, {
      transaction: t,
    });

    /* ─────────────────────────────
       STOCK MOVEMENTS
    ───────────────────────────── */

    await StockMovements.bulkCreate(stockMovementsData, {
      transaction: t,
    });

    /* ─────────────────────────────
       CREATE DEBT
    ───────────────────────────── */

    if (status === "DEBT" || status === "PARTIAL") {
      await Indebtedness.create(
        {
          customerName,
          customerPhone,
          invoiceNumber,

          totalAmount: totalPrice,

          paidAmount,

          remainingAmount,

          status: status === "DEBT" ? "pending" : "partial",

          notes: `فاتورة كاشير رقم ${invoiceNumber}`,
        },
        { transaction: t },
      );
    }

    /* ─────────────────────────────
       COMMIT
    ───────────────────────────── */

    await t.commit();

    return res.status(201).json({
      Message: "تم إنشاء الفاتورة بنجاح",
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
    });
  } catch (e) {
    await t.rollback();

    console.log(e);

    return res.status(500).json({
      Message: "حدث خطأ ما",
      error: e.message,
    });
  }
};

exports.getSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search || "";
    const status = req.query.status || "";
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const where = {};

    // SEARCH
    if (search) {
      where.invoiceNumber = {
        [Op.like]: `%${search}%`,
      };
    }

    // STATUS FILTER
    if (status && status !== "ALL") {
      const statuses = status.split(",");
      where.status = {
        [Op.in]: statuses,
      };
    }

    // DATE RANGE FILTER
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = {
        [Op.between]: [start, end],
      };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      where.createdAt = {
        [Op.gte]: start,
      };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = {
        [Op.lte]: end,
      };
    }

    const { rows, count } = await Sales.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.json({
      sales: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      Message: "حدث خطأ",
    });
  }
};

exports.getSaleDetails = async (req, res) => {
  try {
    const sale = await Sales.findByPk(req.params.id, {
      include: [
        {
          model: SaleItems,
          include: [
            {
              model: Products,
              attributes: ["id", "name", "barcode", "sellPrice"],
            },
          ],
        },
      ],
    });

    if (!sale) {
      return res.status(404).json({
        Message: "الفاتورة غير موجودة",
      });
    }

    return res.json(sale);
  } catch (e) {
    console.log(e);

    return res.status(500).json({
      Message: "حدث خطأ",
    });
  }
};

exports.returnSaleItems = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const saleId = req.params.id;
    const { items } = req.body;

    const sale = await Sales.findOne({
      where: {
        [Op.or]: [
          { id: isNaN(saleId) ? 0 : saleId },
          { invoiceNumber: saleId },
        ],
      },
      include: [
        {
          model: SaleItems,
          include: [
            {
              model: Products,
              attributes: [
                "id",
                "name",
                "barcode",
                "sellPrice",
                "storeQuantity",
              ],
            },
          ],
        },
      ],
    });

    if (!sale) {
      return res.status(404).json({ Message: "الفاتورة غير موجودة" });
    }

    let totalRefundAmount = 0;
    const financialTransactions = [];

    for (const item of items) {
      const saleItem = sale.SaleItems.find((i) => i.id === item.saleItemId);
      if (!saleItem) continue;

      const qty = parseInt(item.quantity);
      const available = saleItem.quantity - saleItem.returnedQuantity;

      if (qty > available) {
        await t.rollback();
        return res.status(400).json({ Message: "كمية المرتجع أكبر من المتاح" });
      }

      const updatedReturnedQty = saleItem.returnedQuantity + qty;
      await saleItem.update(
        { returnedQuantity: updatedReturnedQty },
        { transaction: t },
      );

      const product = saleItem.Product;
      const newStoreQuantity = product.storeQuantity + qty;
      await product.update(
        { storeQuantity: newStoreQuantity },
        { transaction: t },
      );

      const itemRefund = qty * saleItem.price;
      const remainingRefundable = sale.paidAmount - (sale.returnedAmount || 0);
      const actualRefund = Math.min(itemRefund, remainingRefundable);
      totalRefundAmount += actualRefund;

      if (actualRefund > 0) {
        financialTransactions.push({
          type: "RETURN",
          invoiceNumber: sale.invoiceNumber,
          amount: -actualRefund,
          sourceType: "SALE_RETURN",
          sourceId: sale.id,
          notes: `مرتجع فاتورة ${sale.invoiceNumber} - منتج ${product.name}`,
          date: DateNow(),
        });
      }

      await StockMovements.create(
        {
          productID: product.id,
          type: "returned",
          quantity: qty,
          quantityAfter: newStoreQuantity,
          unitPrice: saleItem.price,
          date: DateNow(),
          notes: `مرتجع فاتورة ${sale.invoiceNumber}`,
        },
        { transaction: t },
      );
    }

    if (financialTransactions.length) {
      await FinancialTransaction.bulkCreate(financialTransactions, {
        transaction: t,
      });
    }

    const allItemsReturned = sale.SaleItems.every(
      (item) => item.returnedQuantity >= item.quantity,
    );
    const hasAnyReturned = sale.SaleItems.some(
      (item) => item.returnedQuantity > 0,
    );

    let newStatus = sale.status;
    if (allItemsReturned) newStatus = "RETURNED";
    else if (hasAnyReturned) newStatus = "PARTIALLY_RETURNED";

    let updatedRemaining = sale.remainingAmount;
    const debt = await Indebtedness.findOne({
      where: { invoiceNumber: sale.invoiceNumber },
      transaction: t,
    });

    if (debt) {
      const newRemaining = debt.remainingAmount - totalRefundAmount;
      updatedRemaining = Math.max(0, newRemaining);
      const debtStatus = newRemaining <= 0 ? "paid" : "partial";
      await debt.update(
        {
          remainingAmount: updatedRemaining,
          status: debtStatus,
          notes: `تم تعديل الدين بسبب مرتجع (${totalRefundAmount} ج.م)`,
        },
        { transaction: t },
      );
    }

    await sale.update(
      {
        returnedAmount: (sale.returnedAmount || 0) + totalRefundAmount,
        returnedAt: new Date(),
        status: newStatus,
        remainingAmount: updatedRemaining,
      },
      { transaction: t },
    );

    await t.commit();

    return res.json({
      Message: "تم إنشاء المرتجع بنجاح",
      refundedAmount: totalRefundAmount,
    });
  } catch (e) {
    await t.rollback();
    console.error(e);
    return res.status(500).json({ Message: "حدث خطأ", error: e.message });
  }
};

exports.getFinanceOverview = async (req, res) => {
  console.log("Finance overview called");
  try {
    const { startDate, endDate } = req.query;

    const where = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      where.createdAt = {
        [Op.between]: [start, end],
      };
    }

    const income =
      (await FinancialTransaction.sum("amount", {
        where: {
          ...where,
          type: {
            [Op.in]: ["SALE", "DEBT_PAYMENT"],
          },
        },
      })) || 0;

    const returns =
      (await FinancialTransaction.sum("amount", {
        where: {
          ...where,
          type: "RETURN",
        },
      })) || 0;

    const expenses =
      (await FinancialTransaction.sum("amount", {
        where: {
          ...where,
          type: {
            [Op.in]: ["EXPENSE", "WITHDRAWAL"],
          },
        },
      })) || 0;

    const net = Number(income) - Math.abs(Number(returns)) - Number(expenses);

    const transactions = await FinancialTransaction.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      income: Number(income),
      returns: Math.abs(Number(returns)),
      expenses: Number(expenses),
      net,
      transactions,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      Message: "حدث خطأ",
    });
  }
};
