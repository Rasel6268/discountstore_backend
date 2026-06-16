const express = require("express");

const {
  deleteCategory,
  getAllCategories,
  createMainCategory,
  getMainCategories,
  createSubCategory,
  getCategoryById,
  updateCategory,
  getCategoriesWithProductCounts
} = require("../controllers/category.controller");
const verifyToken = require("../middleware/verifyToken");
const AdminVerify = require("../middleware/AdminVerify");
const router = express.Router();

// Main category routes
router.post("/main", verifyToken, AdminVerify, createMainCategory);
router.get("/main", getMainCategories);

// Subcategory routes
router.post("/sub/:parentId", verifyToken, AdminVerify, createSubCategory);

// General category routes
router.get("/", getAllCategories);
router.get("/with-counts",getCategoriesWithProductCounts)
router.get("/:id", getCategoryById);
router.put("/:id", verifyToken, AdminVerify, updateCategory);
router.delete("/:id", verifyToken, AdminVerify, deleteCategory);

module.exports = router;
