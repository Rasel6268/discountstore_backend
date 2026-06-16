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

const getAllCoupons = async (filters = {}) => {
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
};

const validateCouponService = async (code, subtotal, userId = null) => {
  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return {
        success: false,
        message: "Invalid coupon code",
        data: null
      };
    }
    
    if (!coupon.isValid(userId)) {
      let message = "Coupon is not valid";
      const now = new Date();
      
      if (coupon.status !== "active") message = "Coupon is not active";
      else if (coupon.startDate > now) message = `Coupon starts on ${new Date(coupon.startDate).toLocaleDateString()}`;
      else if (coupon.endDate < now) message = "Coupon has expired";
      else if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) message = "Coupon usage limit reached";
      else if (userId && coupon.perUserLimit) {
        const userUsedCount = coupon.usedBy.filter(u => u.userId && u.userId.toString() === userId.toString()).length;
        if (userUsedCount >= coupon.perUserLimit) message = "You have already used this coupon";
      }
      
      return {
        success: false,
        message,
        data: null
      };
    }
    
    const discountResult = coupon.calculateDiscount(subtotal);
    
    if (!discountResult.valid) {
      return {
        success: false,
        message: discountResult.message,
        data: null
      };
    }
    
    return {
      success: true,
      message: discountResult.message,
      data: {
        couponId: coupon._id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        discount: discountResult.discount,
        maxDiscount: coupon.maxDiscount,
        minPurchase: coupon.minPurchase
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to validate coupon",
      data: null
    };
  }
};

const applyCouponService = async (couponData) => {
  const {code,userId,orderId,discountAmount} = couponData;
  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return {
        success: false,
        message: "Coupon not found"
      };
    }
    
  const result =   await coupon.markAsUsed(userId, orderId, discountAmount);
  
    
    return {
      success: true,
      message: "Coupon applied successfully"
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to apply coupon"
    };
  }
};

const getCouponByIdService = async (couponId) => {
  try {
    const coupon = await Coupon.findById(couponId)
      .populate('createdBy', 'name email')
      .populate('usedBy.userId', 'name email');
    
    if (!coupon) {
      return {
        success: false,
        message: "Coupon not found",
        data: null
      };
    }
    
    return {
      success: true,
      message: "Coupon retrieved successfully",
      data: coupon
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to retrieve coupon",
      data: null
    };
  }
};

const updateCouponService = async (couponId, updateData) => {
  try {
    const coupon = await Coupon.findById(couponId);
    
    if (!coupon) {
      return {
        success: false,
        message: "Coupon not found",
        data: null
      };
    }
    
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
      const existingCoupon = await Coupon.findOne({ 
        code: updateData.code, 
        _id: { $ne: couponId } 
      });
      
      if (existingCoupon) {
        return {
          success: false,
          message: "Coupon code already exists",
          data: null
        };
      }
    }
    
    Object.assign(coupon, updateData);
    await coupon.save();
    
    return {
      success: true,
      message: "Coupon updated successfully",
      data: coupon
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to update coupon",
      data: null
    };
  }
};

const deleteCouponService = async (couponId) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(couponId);
    
    if (!coupon) {
      return {
        success: false,
        message: "Coupon not found"
      };
    }
    
    return {
      success: true,
      message: "Coupon deleted successfully"
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to delete coupon"
    };
  }
};

module.exports = {
  createCouponService,
  getAllCoupons,
  validateCouponService,
  applyCouponService,
  getCouponByIdService,
  updateCouponService,
  deleteCouponService
};