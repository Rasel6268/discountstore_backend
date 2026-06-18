const express = require("express");
const {
  getAllCouponsController,
  createCouponController,
  validateCouponController,
  getCouponByIdController,
  updateCouponController,
  deleteCouponController,
  applyCouponController,
} = require("../controllers/Coupon.controller");
const verifyToken = require("../middleware/verifyToken");
const AdminVerify = require("../middleware/AdminVerify");
const router = express.Router();

// Public routes
router.post("/validate", validateCouponController);

// Admin routes (add your auth middleware here)
router.post("/create", verifyToken, AdminVerify, createCouponController);
router.post("/apply", verifyToken, applyCouponController);
router.get("/", getAllCouponsController);
router.get("/:id", getCouponByIdController);
router.put("/:id", verifyToken, AdminVerify, updateCouponController);
router.delete("/:id", verifyToken, AdminVerify, deleteCouponController);

module.exports = router;
