const express = require("express");
const {
  getAllCouponsController,
  createCouponController,
  validateCouponController,
  getCouponByIdController,
  updateCouponController,
  deleteCouponController,
  applyCouponController
} = require("../controllers/Coupon.controller");
const router = express.Router();

// Public routes
router.post("/validate", validateCouponController);

// Admin routes (add your auth middleware here)
router.post("/create", createCouponController);
router.post("/apply", applyCouponController);
router.get("/", getAllCouponsController);
router.get("/:id", getCouponByIdController);
router.put("/:id", updateCouponController);
router.delete("/:id", deleteCouponController);


module.exports = router;
