const express = require("express");
const router = express.Router();
const {
  getCategories,
} = require("../../controllers/categories/categories.controllers");

router.get("/api/categories", getCategories);

module.exports = router;
