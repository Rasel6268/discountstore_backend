const {
  createCouponService,
  getAllCoupons,
  validateCouponService,
  applyCouponService,
  getCouponByIdService,
  updateCouponService,
  deleteCouponService,
} = require("../services/coupon.service");

const createCouponController = async (req, res) => {
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

const getAllCouponsController = async (req, res) => {
  try {
    const { status, type, search, page, limit } = req.query;
    const result = await getAllCoupons({
      status,
      type,
      search,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      coupons: result.coupons,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const validateCouponController = async (req, res) => {
  try {
    const { code, subtotal, userId } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const result = await validateCouponService(code, subtotal, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to validate coupon",
    });
  }
};

const applyCouponController = async (req, res) => {
  try {
    const result = await applyCouponService(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to apply coupon",
    });
  }
};

const getCouponByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getCouponByIdService(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve coupon",
    });
  }
};

const updateCouponController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateCouponService(id, req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update coupon",
    });
  }
};

const deleteCouponController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteCouponService(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete coupon",
    });
  }
};

module.exports = {
  createCouponController,
  getAllCouponsController,
  validateCouponController,
  applyCouponController,
  getCouponByIdController,
  updateCouponController,
  deleteCouponController,
};
