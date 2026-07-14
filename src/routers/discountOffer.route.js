const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const AdminVerify = require("../middleware/AdminVerify");
const {
  createDiscountController,
  getDiscountController,
  getActiveDiscountsController,
  getDiscountByIdController,
  updateDiscountController,
  updateDiscountStatusController,
  deleteDiscountController,
} = require("../controllers/discountOffer.controller");

const router = express.Router();

router.post("/create", verifyToken, AdminVerify, createDiscountController);
router.get("/", getDiscountController);
router.get("/active", getActiveDiscountsController);
router.get("/:id", getDiscountByIdController);
router.patch("/:id/status", updateDiscountStatusController);
router.put("/:id", updateDiscountController);
router.delete("/:id",deleteDiscountController)


module.exports = router;
