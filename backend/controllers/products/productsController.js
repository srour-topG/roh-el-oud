const { Op } = require("sequelize");
const Products = require("../../models/product.models");
const StockMovements = require("../../models/stockMovement.models");
const Categories = require("../../models/category.models");
const { DateNowHour } = require("../../utils/date");
const { sequelize } = require("../../config/databaseConnection");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/products";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${Date.now()}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("يُسمح بالصور فقط"), false);
};
exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── GET /products ──────────────────────────────────────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } },
      ];
    }
    if (req.query.categoryId) {
      where.categoryId = req.query.categoryId;
    }

    if (status === "low") {
      where.quantity = { [Op.gt]: 0, [Op.lte]: sequelize.col("minQuantity") };
    } else if (status === "out") {
      where.quantity = 0;
    }

    const { rows, count } = await Products.findAndCountAll({
      where,
      include: [
        {
          model: Categories,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    const totalCount = await Products.count();
    const lowStockCount = await Products.count({
      where: {
        quantity: { [Op.gt]: 0, [Op.lte]: sequelize.col("minQuantity") },
      },
    });
    const emptyCount = await Products.count({
      where: { quantity: { [Op.eq]: 0 } },
    });

    res.json({
      products: rows,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      totalItems: count,
      stats: { totalCount, lowStockCount, emptyCount },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ statusCode: "500", Message: "حدث خطأ ما" });
  }
};

// ── GET /products/:id ─────────────────────────────────────────────────────────
exports.getProduct = async (req, res) => {
  try {
    const product = await Products.findOne({
      where: { id: req.params.id },
    });

    if (!product) return res.status(404).json({ Message: "المنتج غير موجود" });

    res.json(product);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      statusCode: "500",
      Message: "حدث خطأ ما",
    });
  }
};

// ── POST /products ─────────────────────────────────────────────────────────────
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      sellPrice,
      buyPrice,
      quantity,
      minQuantity,
      barcode,
      expireDate,
      category,
    } = req.body;

    if (!name || !sellPrice || !buyPrice) {
      return res.status(400).json({ Message: "الاسم والأسعار مطلوبة" });
    }

    if (barcode) {
      const exists = await Products.findOne({ where: { barcode } });
      if (exists)
        return res
          .status(409)
          .json({ statusCode: "409", Message: "الباركود موجود بالفعل" });
    }

    let categoryId = null;
    if (category && category.trim()) {
      let cat = await Categories.findOne({ where: { name: category.trim() } });
      if (!cat) cat = await Categories.create({ name: category.trim() });
      categoryId = cat.id;
    }

    const imageUrl = req.file ? req.file.path : null;

    const product = await Products.create({
      name,
      sellPrice,
      buyPrice,
      quantity: parseInt(quantity) || 0,
      minQuantity: parseInt(minQuantity) || 5,
      barcode: barcode || null,
      categoryId,
      image: imageUrl,
    });

    if (parseInt(quantity) > 0) {
      await StockMovements.create({
        productID: product.id,
        type: "add",
        quantity: parseInt(quantity),
        quantityAfter: parseInt(quantity),
        unitPrice: parseFloat(buyPrice),
        notes: "رصيد أولي عند إضافة المنتج",
        date: DateNowHour(),
      });
    }

    res
      .status(200)
      .json({ statusCode: "200", Message: "تمت إضافة المنتج بنجاح", product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ statusCode: "500", Message: "حدث خطأ ما" });
  }
};

// ── PATCH /products/:id ────────────────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      sellPrice,
      buyPrice,
      minQuantity,
      barcode,
      expireDate,
      category,
    } = req.body;
    const { id } = req.params;

    if (barcode) {
      const exists = await Products.findOne({
        where: { barcode, id: { [Op.ne]: id } },
      });
      if (exists)
        return res
          .status(409)
          .json({ statusCode: "409", Message: "الباركود مستخدم" });
    }

    const updateData = {
      name,
      sellPrice,
      buyPrice,
      minQuantity,
      barcode,
      expireDate,
      category,
    };
    if (req.file) updateData.image = req.file.path;

    const [updated] = await Products.update(updateData, { where: { id } });
    if (updated === 0)
      return res.status(404).json({ Message: "المنتج غير موجود" });

    res.json({ statusCode: "200", Message: "تم التعديل بنجاح" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ statusCode: "500", Message: "حدث خطأ ما" });
  }
};

// ── DELETE /products/:id ───────────────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const result = await Products.destroy({ where: { id: req.params.id } });
    if (!result) return res.status(404).json({ Message: "المنتج غير موجود" });
    res.json({ statusCode: "200", Message: "تم الحذف بنجاح" });
  } catch (e) {
    res.status(500).json({ statusCode: "500", Message: "حدث خطأ ما" });
  }
};

// ── POST /products/stock ── (add or remove from stock only, NOT for cashier sells)
exports.stockMovement = async (req, res) => {
  try {
    const { productID, type, quantity, notes } = req.body;
    if (!productID || !type || !quantity)
      return res.status(400).json({ Message: "بيانات ناقصة" });

    const product = await Products.findOne({ where: { id: productID } });
    if (!product) return res.status(404).json({ Message: "المنتج غير موجود" });

    const qty = parseInt(quantity);
    if (type === "remove" && product.quantity < qty) {
      return res.status(400).json({
        statusCode: "400",
        Message: `الكمية المتاحة ${product.quantity} فقط`,
      });
    }

    const newQty =
      type === "add" ? product.quantity + qty : product.quantity - qty;
    let unitPrice;
    if (type === "add") {
      unitPrice = parseFloat(product.buyPrice);
    } else {
      if (notes && notes.includes("بيع كاشير")) {
        unitPrice = parseFloat(product.sellPrice);
      } else {
        unitPrice = parseFloat(product.buyPrice);
      }
    }

    await Products.update({ quantity: newQty }, { where: { id: productID } });
    await StockMovements.create({
      productID,
      type,
      quantity: qty,
      quantityAfter: newQty,
      unitPrice,
      notes: notes || null,
      date: DateNowHour(),
    });

    res.json({
      statusCode: "200",
      Message:
        type === "add" ? "تمت إضافة الكمية بنجاح" : "تم سحب الكمية بنجاح",
      newQuantity: newQty,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ statusCode: "500", Message: "حدث خطأ ما" });
  }
};

// ── POST /products/sell ── Cashier sells (decrements stock, logs as revenue)
exports.sellProduct = async (req, res) => {
  try {
    const { productID, quantity } = req.body;
    if (!productID || !quantity)
      return res.status(400).json({ Message: "بيانات ناقصة" });

    const product = await Products.findOne({ where: { id: productID } });
    if (!product) return res.status(404).json({ Message: "المنتج غير موجود" });

    const qty = parseInt(quantity);
    if (product.quantity < qty) {
      return res.status(400).json({
        statusCode: "400",
        Message: `الكمية المتاحة ${product.quantity} فقط`,
      });
    }

    const newQty = product.quantity - qty;
    await Products.update({ quantity: newQty }, { where: { id: productID } });
    await StockMovements.create({
      productID,
      type: "remove",
      quantity: qty,
      quantityAfter: newQty,
      unitPrice: parseFloat(product.sellPrice),
      notes: "بيع كاشير",
      date: DateNowHour(),
    });

    res.json({
      statusCode: "200",
      Message: `تم بيع ${qty} وحدة بنجاح`,
      newQuantity: newQty,
      revenue: qty * parseFloat(product.sellPrice),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ statusCode: "500", Message: "حدث خطأ ما" });
  }
};

// ── GET /products/stock/movements ─────────────────────────────────────────────
exports.getMovements = async (req, res) => {
  try {
    const {
      productID,
      type,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    } = req.query;
    const where = {};
    if (productID) where.productID = productID;
    if (type && type !== "all") where.type = type;
    if (startDate || endDate) {
      where.date = {
        [Op.between]: [
          startDate
            ? new Date(`${startDate}T00:00:00`)
            : new Date("2000-01-01"),
          endDate ? new Date(`${endDate}T23:59:59`) : new Date("2099-12-31"),
        ],
      };
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await StockMovements.findAndCountAll({
      where,
      include: [{ model: Products, required: true }],
      order: [["date", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayCount = await StockMovements.count({
      where: { date: { [Op.between]: [todayStart, todayEnd] } },
    });

    res.json({
      movements: rows,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      totalCount: count,
      todayCount,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ statusCode: "500", Message: "حدث خطأ ما" });
  }
};

// ── GET /products/analytics ────────────────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    // Revenue = sum of sell movements * unitPrice
    const revenueResult = await StockMovements.findAll({
      where: { type: "remove" },
      attributes: [
        [
          sequelize.fn("SUM", sequelize.literal("quantity * unitPrice")),
          "total",
        ],
      ],
      raw: true,
    });
    const totalRevenue = parseFloat(revenueResult[0]?.total) || 0;

    // Expenses = sum of add movements * unitPrice (buy price)
    const expenseResult = await StockMovements.findAll({
      where: { type: "add" },
      attributes: [
        [
          sequelize.fn("SUM", sequelize.literal("quantity * unitPrice")),
          "total",
        ],
      ],
      raw: true,
    });
    const totalExpenses = parseFloat(expenseResult[0]?.total) || 0;

    const netProfit = totalRevenue - totalExpenses;

    // Monthly breakdown — last 12 months
    const allMovements = await StockMovements.findAll({
      attributes: ["date", "type", "quantity", "unitPrice"],
      raw: true,
    });

    const monthlyMap = {};
    allMovements.forEach((m) => {
      const date = new Date(m.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const amount = m.quantity * m.unitPrice;
      if (!monthlyMap[monthKey])
        monthlyMap[monthKey] = { revenue: 0, expenses: 0 };
      if (m.type === "remove") monthlyMap[monthKey].revenue += amount;
      else if (m.type === "add") monthlyMap[monthKey].expenses += amount;
    });
    const monthlyBreakdown = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        revenue: v.revenue,
        expenses: v.expenses,
        profit: v.revenue - v.expenses,
      }));

    // Current inventory value
    const allProducts = await Products.findAll({
      order: [["quantity", "DESC"]],
    });
    const totalBuyValue = allProducts.reduce(
      (s, p) => s + parseFloat(p.buyPrice) * p.quantity,
      0,
    );
    const totalSellValue = allProducts.reduce(
      (s, p) => s + parseFloat(p.sellPrice) * p.quantity,
      0,
    );

    // Alerts
    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(now.getDate() + 7);
    const lowStock = allProducts.filter(
      (p) => p.quantity > 0 && p.quantity <= p.minQuantity,
    );
    const expired = allProducts.filter(
      (p) => p.expireDate && new Date(p.expireDate) < now,
    );
    const expiringSoon = allProducts.filter(
      (p) =>
        p.expireDate &&
        new Date(p.expireDate) <= weekFromNow &&
        new Date(p.expireDate) >= now,
    );

    // Top sellers
    const topMoved = await StockMovements.findAll({
      where: { type: "remove" },
      attributes: [
        "productID",
        [
          sequelize.fn("SUM", sequelize.col("StockMovements.quantity")),
          "totalSold",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              "StockMovements.quantity * StockMovements.unitPrice",
            ),
          ),
          "totalRevenue",
        ],
      ],
      group: ["productID"],
      order: [
        [sequelize.fn("SUM", sequelize.col("StockMovements.quantity")), "DESC"],
      ],
      limit: 5,
      include: [{ model: Products, required: true }],
    });

    // Category distribution
    const categories = {};
    allProducts.forEach((p) => {
      const cat = p.category || "أخرى";
      categories[cat] = (categories[cat] || 0) + 1;
    });

    res.json({
      totalRevenue,
      totalExpenses,
      netProfit,
      monthlyBreakdown,
      totalBuyValue,
      totalSellValue,
      totalProducts: allProducts.length,
      lowStockCount: lowStock.length,
      expiredCount: expired.length,
      expiringSoonCount: expiringSoon.length,
      topMoved,
      lowStockProducts: lowStock.slice(0, 5),
      expiredProducts: expired.slice(0, 5),
      categoryDistribution: Object.entries(categories).map(([name, count]) => ({
        name,
        count,
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ statusCode: "500", Message: "حدث خطأ ما" });
  }
};
