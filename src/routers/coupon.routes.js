const express = require("express");
const {getAllCouponController, createCoupenController } = require("../controllers/Coupon.controller");
const router = express.Router();

router.post("/create",createCoupenController);
router.get("/",getAllCouponController);
// router.get("/:id", getBrandByIdController);
// router.put("/:id", updateBrandController);
// router.delete("/:id", deleteBrandController);

module.exports = router;
