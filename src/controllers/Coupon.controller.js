const { getAllBrandServices } = require("../services/brand.service");
const { createCouponService, getAllCoupons } = require("../services/coupon.service");

const createCoupenController = async (req, res) => {
  try {
    const result = await createCouponService(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
      data: null,
    });
  }
};
const getAllCouponController = async(req,res) => {
    try {
         const { status, type, search, page, limit } = req.query;
  const result = await getAllCoupons({
        status,
        type,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      })

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
         res.status(400).json({
        success: false,
        message: error.message
      });
    }
}

module.exports = {
  createCoupenController,
  getAllCouponController
};
