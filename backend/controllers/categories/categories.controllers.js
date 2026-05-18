const { Categories } = require("../../models");

exports.getCategories = async (req, res) => {
  try {
    const categories = await Categories.findAll({
      order: [["name", "ASC"]],
    });

    res.json(categories);
  } catch (e) {
    res.status(500).json({
      statusCode: "500",
      Message: "حدث خطأ ما",
    });
  }
};
