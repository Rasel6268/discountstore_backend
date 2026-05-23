// models/Order.js
const mongoose = require("mongoose");

// ==========================================
// ORDER ITEM SIZE SCHEMA
// ==========================================
const orderItemSizeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["men", "women", "unisex", "kids"],
      default: "unisex",
    },

    extraPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    sku: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// ==========================================
// ORDER ITEM COLOR SCHEMA
// ==========================================
const orderItemColorSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    hexCode: {
      type: String,
      default: "#000000",
      trim: true,
    },
  },
  { _id: false }
);

// ==========================================
// ORDER ITEM SCHEMA
// ==========================================
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    image: {
      type: String,
      default: null,
    },

    size: orderItemSizeSchema,

    color: orderItemColorSchema,

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

// ==========================================
// SHIPPING ADDRESS SCHEMA
// ==========================================
const shippingAddressSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },

    addressLine2: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    area: {
      type: String,
      required: true,
      trim: true,
    },

    postCode: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      default: "Bangladesh",
      trim: true,
    },
  },
  { _id: false }
);

// ==========================================
// PAYMENT SCHEMA
// ==========================================
const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["ssl", "cod", "bkash", "nagad", "rocket"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
    },

    transactionId: {
      type: String,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paidAt: {
      type: Date,
    },

    sslData: {
      bank_tran_id: String,
      card_type: String,
      card_no: String,
      currency: String,
      currency_amount: Number,
      currency_rate: Number,
      tran_date: Date,
      verify_sign: String,
      verify_sign_sha2: String,
    },
  },
  { _id: false }
);

// ==========================================
// STATUS TIMELINE SCHEMA
// ==========================================
const orderStatusTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      required: true,
    },

    note: {
      type: String,
      default: "",
    },

    updatedBy: {
      type: String,
      default: "system",
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// ==========================================
// MAIN ORDER SCHEMA
// ==========================================
const orderSchema = new mongoose.Schema(
  {
    // ======================================
    // ORDER INFO
    // ======================================
    orderId: {
      type: String,
      unique: true,
      index: true,
    },

    // ======================================
    // USER INFO
    // ======================================
    user: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      guestInfo: {
        type: Boolean,
        default: false,
      },
    },

    // ======================================
    // SHIPPING
    // ======================================
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    shippingArea: {
      type: String,
      enum: ["dhaka", "outside_dhaka"],
      required: true,
    },

    shippingCost: {
      type: Number,
      required: true,
      min: 0,
    },

    estimatedDeliveryDate: {
      type: Date,
    },

    // ======================================
    // ORDER ITEMS
    // ======================================
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },

    // ======================================
    // PRICING
    // ======================================
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    couponCode: {
      type: String,
      trim: true,
    },

    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // ======================================
    // PAYMENT
    // ======================================
    payment: {
      type: paymentSchema,
      required: true,
    },

    // ======================================
    // ORDER STATUS
    // ======================================
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    statusTimeline: [orderStatusTimelineSchema],

    // ======================================
    // NOTES
    // ======================================
    notes: {
      type: String,
      default: "",
      trim: true,
    },

    adminNotes: {
      type: String,
      default: "",
      trim: true,
    },

    // ======================================
    // TRACKING INFO
    // ======================================
    trackingInfo: {
      courier: {
        type: String,
        trim: true,
      },

      trackingNumber: {
        type: String,
        trim: true,
      },

      trackingUrl: {
        type: String,
        trim: true,
      },

      estimatedDelivery: {
        type: Date,
      },
    },

    // ======================================
    // CANCELLATION
    // ======================================
    cancelledAt: Date,

    cancellationReason: {
      type: String,
      trim: true,
    },

    // ======================================
    // DELIVERY
    // ======================================
    deliveredAt: Date,

    deliveryReceivedBy: {
      type: String,
      trim: true,
    },

    // ======================================
    // META
    // ======================================
    ipAddress: String,
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  }
);

// ==========================================
// VIRTUALS
// ==========================================
orderSchema.virtual("totalItems").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

orderSchema.virtual("summary").get(function () {
  return {
    orderId: this.orderId,
    totalItems: this.totalItems,
    subtotal: this.subtotal,
    shipping: this.shippingCost,
    tax: this.tax,
    total: this.total,
    orderStatus: this.orderStatus,
    paymentStatus: this.payment.status,
  };
});

// ==========================================
// PRE SAVE MIDDLEWARE
// ==========================================
orderSchema.pre("save", async function () {
  // Generate order ID
  if (!this.orderId) {
    const date = new Date();

    const year = date.getFullYear().toString().slice(-2);

    const month = (date.getMonth() + 1)
      .toString()
      .padStart(2, "0");

    const day = date.getDate()
      .toString()
      .padStart(2, "0");

    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    this.orderId = `ORD${year}${month}${day}${random}`;
  }

  // Add status timeline
  if (
    this.isModified("orderStatus") ||
    this.statusTimeline.length === 0
  ) {
    this.statusTimeline.push({
      status: this.orderStatus,
      timestamp: new Date(),
      updatedBy: this.user?.name || "system",
    });
  }

  // Delivered
  if (
    this.orderStatus === "delivered" &&
    !this.deliveredAt
  ) {
    this.deliveredAt = new Date();
  }

  // Cancelled
  if (
    this.orderStatus === "cancelled" &&
    !this.cancelledAt
  ) {
    this.cancelledAt = new Date();
  }

  // Payment completed
  if (
    this.payment?.status === "completed" &&
    !this.payment?.paidAt
  ) {
    this.payment.paidAt = new Date();
  }

  // Estimated delivery
  if (
    !this.estimatedDeliveryDate &&
    this.orderStatus !== "cancelled"
  ) {
    const deliveryDays =
      this.shippingArea === "dhaka" ? 2 : 5;

    const estimatedDate = new Date();

    estimatedDate.setDate(
      estimatedDate.getDate() + deliveryDays
    );

    this.estimatedDeliveryDate = estimatedDate;
  }
});

// ==========================================
// STATIC METHODS
// ==========================================
orderSchema.statics.getOrderStats = async function (
  startDate,
  endDate
) {
  const match = {};

  if (startDate || endDate) {
    match.createdAt = {};

    if (startDate) {
      match.createdAt.$gte = new Date(startDate);
    }

    if (endDate) {
      match.createdAt.$lte = new Date(endDate);
    }
  }

  const stats = await this.aggregate([
    { $match: match },

    {
      $group: {
        _id: null,

        totalOrders: {
          $sum: 1,
        },

        totalRevenue: {
          $sum: "$total",
        },

        averageOrderValue: {
          $avg: "$total",
        },

        completedOrders: {
          $sum: {
            $cond: [
              {
                $eq: ["$orderStatus", "delivered"],
              },
              1,
              0,
            ],
          },
        },

        cancelledOrders: {
          $sum: {
            $cond: [
              {
                $eq: ["$orderStatus", "cancelled"],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      completedOrders: 0,
      cancelledOrders: 0,
    }
  );
};

// ==========================================
// INSTANCE METHODS
// ==========================================
orderSchema.methods.updateStatus = async function (
  newStatus,
  note = "",
  updatedBy = "system"
) {
  const oldStatus = this.orderStatus;

  this.orderStatus = newStatus;

  this.statusTimeline.push({
    status: newStatus,
    note,
    updatedBy,
    timestamp: new Date(),
  });

  if (
    newStatus === "delivered" &&
    !this.deliveredAt
  ) {
    this.deliveredAt = new Date();
  }

  if (
    newStatus === "cancelled" &&
    !this.cancelledAt
  ) {
    this.cancelledAt = new Date();

    if (note) {
      this.cancellationReason = note;
    }
  }

  await this.save();

  return {
    oldStatus,
    newStatus,
  };
};

orderSchema.methods.addTracking = async function (
  courier,
  trackingNumber,
  trackingUrl = ""
) {
  this.trackingInfo = {
    courier,
    trackingNumber,
    trackingUrl,
    estimatedDelivery: this.estimatedDeliveryDate,
  };

  await this.save();

  return this.trackingInfo;
};

orderSchema.methods.getDetailedSummary =
  function () {
    return {
      orderId: this.orderId,

      customer: {
        name: this.user.name,
        email: this.user.email,
        phone: this.user.phone,
      },

      shipping: {
        address: this.shippingAddress,
        area: this.shippingArea,
        cost: this.shippingCost,
      },

      items: this.items,

      pricing: {
        subtotal: this.subtotal,
        discount: this.discount,
        tax: this.tax,
        shipping: this.shippingCost,
        total: this.total,
      },

      payment: this.payment,

      status: {
        current: this.orderStatus,
        timeline: this.statusTimeline,
      },

      tracking: this.trackingInfo,
    };
  };

// ==========================================
// EXPORT
// ==========================================
module.exports = mongoose.model(
  "Order",
  orderSchema
);