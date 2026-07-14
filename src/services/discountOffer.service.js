const Discount = require("../models/Discount");
const Coupon = require("../models/Coupon");

// Create a new discount offer
exports.createDiscountOffer = async (data) => {
  try {
    // Check if coupon exists
    if (data.coupon) {
      const couponExists = await Coupon.findById(data.coupon);
      if (!couponExists) {
        throw new Error("Selected coupon does not exist");
      }
    }

    // Check for overlapping discounts
    const overlapping = await Discount.findOne({
      coupon: data.coupon,
      status: { $ne: "expired" },
      $or: [
        {
          startDate: { $lte: data.endDate },
          endDate: { $gte: data.startDate },
        },
      ],
    });

    if (overlapping) {
      throw new Error(
        "A discount with this coupon already exists in the date range",
      );
    }

    const discount = new Discount(data);
    await discount.save();
    await discount.populate("coupon", "code type value minPurchase userGroups");

    return discount;
  } catch (error) {
    throw error;
  }
};

// Get all discount offers with filters
exports.getDiscountOffers = async (filters = {}, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.offerType) query.offerType = filters.offerType;

    // Add date filters for auto-expiry
    const now = new Date();
    query.$or = [{ endDate: { $gte: now } }, { status: { $ne: "expired" } }];

    const [discounts, total] = await Promise.all([
      Discount.find(query)
        .populate("coupon", "code type value minPurchase userGroups")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Discount.countDocuments(query),
    ]);

    // Update expired status
    await Discount.updateMany(
      { endDate: { $lt: now }, status: { $ne: "expired" } },
      { status: "expired" },
    );

    return {
      discounts,
      total,
    };
  } catch (error) {
    throw error;
  }
};

// Get a single discount offer by ID
exports.getDiscountOfferById = async (id) => {
  try {
    const discount = await Discount.findById(id).populate(
      "coupon",
      "code type value minPurchase userGroups usageLimit usedCount",
    );

    if (!discount) {
      return null;
    }

    // Update status if expired
    const now = new Date();
    if (discount.endDate < now && discount.status !== "expired") {
      discount.status = "expired";
      await discount.save();
    }
    return discount;
  } catch (error) {
    throw error;
  }
};

// Update a discount offer
exports.updateDiscountOffer = async (id, updateData) => {
  try {
    const discount = await Discount.findById(id);

    if (!discount) {
      return null;
    }

    // Prevent updating expired discounts
    if (discount.status === "expired") {
      throw new Error("Cannot update an expired discount");
    }

    // Check coupon validity if changing
    if (updateData.coupon && updateData.coupon !== discount.coupon) {
      const couponExists = await Coupon.findById(updateData.coupon);
      if (!couponExists) {
        throw new Error("Selected coupon does not exist");
      }
    }

    Object.assign(discount, updateData);
    await discount.save();
    await discount.populate("coupon", "code type value minPurchase userGroups");

    return discount;
  } catch (error) {
    throw error;
  }
};
exports.updateDiscountStatus = async (id, status) => {
  try {
    const updatedDiscount = await Discount.findByIdAndUpdate(
      id,
      status,
      {
        after: true,
        runValidators: true,
      }
    );

    return updatedDiscount;
  } catch (error) {
    throw error;
  }
};

// Delete a discount offer
exports.deleteDiscountOffer = async (id) => {
  try {
    const discount = await Discount.findByIdAndDelete(id);
    return discount;
  } catch (error) {
    throw error;
  }
};

// Get active discounts for customers
exports.getActiveDiscounts = async () => {
  try {
    const now = new Date();

    const discounts = await Discount.find({
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate("coupon", "code type value minPurchase userGroups")
      .sort({ endDate: 1 })
      .lean();

    return discounts;
  } catch (error) {
    throw error;
  }
};
