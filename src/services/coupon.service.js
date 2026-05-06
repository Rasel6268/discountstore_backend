const Coupon = require("../models/Coupon");

const createCouponService = async (couponData) => {
  try {
    const isExistCoupon = await Coupon.findOne({
      code: couponData.code.toUpperCase(),
    });

    if (isExistCoupon) {
      return {
        success: false,
        message: "Coupon code already exists",
        data: null,
      };
    }

    const coupon = new Coupon({
      ...couponData,
      code: couponData.code.toUpperCase(),
    });

    await coupon.save();

    return {
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    };

  } catch (error) {
    return {
      success: false,
      message: error.message || "Something went wrong",
      data: null,
    };
  }
};
const  getAllCoupons  =async(filters = {})=> {
    const { status, type, search, page = 1, limit = 20 } = filters;
    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email'),
      Coupon.countDocuments(query)
    ]);
    
    return {
      coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }


module.exports = {
    createCouponService,
    getAllCoupons
}