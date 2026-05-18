const { Op } = require("sequelize");
const expenses_finance = require("../../models/expnses");
const { DateNow } = require("../../utils/date");

exports.expenses = async (req, res) => {
  try {
    const { type, value } = req.body;

    const date = DateNow();
    const expenses = await expenses_finance.create({
      type: type,
      value: value,
      date: date,
    });

    if (!expenses) {
      throw new Error("Someting went wrong");
    }

    return res
      .status(200)
      .json({ statusCode: "200", Message: "تمت الإضافة بنجاح" });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ statusCode: "500", Message: "حدث خطأ ما حاول مرة أخرى" });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    let { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.json({ expenses: [] });
    }

    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T23:59:59.999");

    const expenses = await expenses_finance.findAll({
      where: {
        date: {
          [Op.between]: [start, end],
        },
      },
      order: [["date", "DESC"]],
    });

    res.json({ expenses });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ statusCode: "500", Message: "حدث خطأ ما حاول مرة أخرى" });
  }
};

exports.deleteExpenses = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await expenses_finance.destroy({ where: { id: id } });

    if (!result) {
      throw new Error("Something went wrong");
    }

    return res
      .status(200)
      .json({ statusCode: "200", Message: "تم الحذف بنجاح" });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ statusCode: "500", Message: "حدث خطأ ما حاول مرة أخرى" });
  }
};
