const { Op } = require("sequelize");
const { sequelize } = require("../../config/databaseConnection");

const {
  Sales,
  SaleItems,
  Products,
  Indebtedness,
  StockMovements,
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

      if (product.quantity < quantity) {
        await t.rollback();

        return res.status(400).json({
          Message: `${product.name} الكمية غير متوفرة`,
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
          quantity: product.quantity - quantity,
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

    const sale = await Sales.findByPk(saleId, {
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
      transaction: t,
      lock: true,
    });

    if (!sale) {
      await t.rollback();

      return res.status(404).json({
        Message: "الفاتورة غير موجودة",
      });
    }

    let returnedAmount = 0;

    // something went wrong
    for (const item of items) {
      const saleItem = sale.SaleItems.find((i) => i.id === item.saleItemId);

      if (!saleItem) continue;

      const qty = parseInt(item.quantity);

      const available = saleItem.quantity - saleItem.returnedQuantity;

      if (qty > available) {
        await t.rollback();

        return res.status(400).json({
          Message: "كمية المرتجع أكبر من المتاح",
        });
      }

      // UPDATE RETURNED QTY
      const updatedReturnedQty = saleItem.returnedQuantity + qty;

      await saleItem.update(
        {
          returnedQuantity: updatedReturnedQty,
        },
        { transaction: t },
      );

      // UPDATE STOCK
      const product = await Products.findByPk(saleItem.productId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const newQuantity = Number(product.quantity) + qty;

      await product.update(
        {
          quantity: newQuantity,
        },
        { transaction: t },
      );

      // TOTAL RETURNED MONEY
      const itemReturnValue = qty * saleItem.price;

      const remainingRefundable =
        Number(sale.paidAmount) - Number(sale.returnedAmount || 0);

      const actualRefund = Math.min(itemReturnValue, remainingRefundable);

      returnedAmount += actualRefund;

      // STOCK MOVEMENT
      await StockMovements.create(
        {
          productID: saleItem.productId,
          type: "returned",
          quantity: qty,
          quantityAfter: newQuantity,
          unitPrice: saleItem.price,
          date: DateNow(),
          notes: `مرتجع فاتورة ${sale.invoiceNumber}`,
        },
        { transaction: t },
      );

      // UPDATE LOCAL INSTANCE
      saleItem.returnedQuantity = updatedReturnedQty;
    }

    /*
      CALCULATE FINAL STATUS
    */

    const allItemsReturned = sale.SaleItems.every(
      (item) => item.returnedQuantity >= item.quantity,
    );

    const hasAnyReturned = sale.SaleItems.some(
      (item) => item.returnedQuantity > 0,
    );

    let newStatus = sale.status;

    if (allItemsReturned) {
      newStatus = "RETURNED";
    } else if (hasAnyReturned) {
      newStatus = "PARTIALLY_RETURNED";
    }

    let updatedRemaining = parseFloat(sale.remainingAmount || 0);

    const debt = await Indebtedness.findOne({
      where: { invoiceNumber: sale.invoiceNumber },
      transaction: t,
      lock: true,
    });

    if (debt) {
      const returned = returnedAmount;
      const newRemaining =
        Number(debt.totalAmount) - Number(debt.paidAmount) - returned;

      const debtStatus =
        newRemaining <= 0
          ? "paid"
          : Number(debt.paidAmount) > 0 || returned > 0
            ? "partial"
            : "pending";
      updatedRemaining = Math.max(0, newRemaining);

      await debt.update(
        {
          remainingAmount: Math.max(0, newRemaining),
          status: debtStatus,
          notes: "تم تعديل الدين بسبب مرتجع",
        },
        { transaction: t },
      );
    }

    await sale.update(
      {
        returnedAmount: parseFloat(sale.returnedAmount || 0) + returnedAmount,
        returnedAt: new Date(),
        status: newStatus,
        remainingAmount: updatedRemaining,
      },
      { transaction: t },
    );

    await t.commit();

    return res.json({
      Message: "تم إنشاء المرتجع بنجاح",
    });
  } catch (e) {
    await t.rollback();

    console.log(e);

    return res.status(500).json({
      Message: "حدث خطأ",
    });
  }
};
