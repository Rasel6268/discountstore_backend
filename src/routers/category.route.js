const express = require("express");

const {
  deleteCategory,
  getAllCategories,
  createMainCategory,
  getMainCategories,
  createSubCategory,
  getCategoryById,
  updateCategory,
} = require("../controllers/category.controller");
const router = express.Router();

// Main category routes
router.post("/main", createMainCategory);
router.get("/main", getMainCategories);

// Subcategory routes
router.post("/sub/:parentId", createSubCategory);

// General category routes
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
