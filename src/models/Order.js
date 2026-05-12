// models/Order.js
import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    // Order tracking information
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    
    // User information
    user: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
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
      },
    },
    
    // Shipping Address
    shippingAddress: {
      addressLine1: {
        type: String,
        required: true,
      },
      addressLine2: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        required: true,
      },
      area: {
        type: String,
        required: true,
      },
      postCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: "Bangladesh",
      },
    },
    
    // Billing Address (if different from shipping)
    billingAddress: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      area: String,
      postCode: String,
      country: String,
      sameAsShipping: {
        type: Boolean,
        default: true,
      },
    },
    
    // Shipping information
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
    
    // Order items
    items: [
      {
        productId: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
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
          default: "",
        },
      },
    ],
    
    // Pricing breakdown
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Payment information
    paymentMethod: {
      type: String,
      enum: ["ssl", "cod"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    
    // SSL Commerce specific fields
    sslData: {
      bank_transaction_id: String,
      bank_name: String,
      card_brand: String,
      card_issuer: String,
      card_issuer_country: String,
      card_issuer_country_code: String,
      currency_amount: String,
      currency_rate: String,
      currency_type: String,
      risk_level: String,
      risk_title: String,
      status: String,
      tran_date: String,
      val_id: String,
    },
    
    // Order status tracking
    orderStatus: {
      type: String,
      enum: [
        "pending",       // Order placed but not processed
        "confirmed",     // Order confirmed
        "processing",    // Processing for delivery
        "shipped",       // Shipped to customer
        "delivered",     // Delivered to customer
        "cancelled",     // Cancelled by customer or admin
        "refunded",      // Refunded
      ],
      default: "pending",
    },
    
    // Order timeline
    statusHistory: [
      {
        status: {
          type: String,
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
    ],
    
    // Delivery information
    deliveryDate: {
      type: Date,
    },
    trackingNumber: {
      type: String,
      default: "",
    },
    deliveryNote: {
      type: String,
      default: "",
    },
    

    
  
    
   
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);


// Generate unique order ID
OrderSchema.statics.generateOrderId = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Count orders for today
  const startOfDay = new Date(year, date.getMonth(), date.getDate());
  const endOfDay = new Date(year, date.getMonth(), date.getDate() + 1);
  
  const todayOrdersCount = await this.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay }
  });
  
  const sequence = String(todayOrdersCount + 1).padStart(4, '0');
  return `ORD-${year}${month}${day}-${sequence}`;
};

// Virtual for formatted total price
OrderSchema.virtual('formattedTotal').get(function() {
  return `৳${this.total.toFixed(2)}`;
});

// Virtual for order summary
OrderSchema.virtual('summary').get(function() {
  return {
    orderId: this.orderId,
    total: this.total,
    status: this.orderStatus,
    paymentStatus: this.paymentStatus,
    date: this.createdAt,
    itemCount: this.items.reduce((sum, item) => sum + item.quantity, 0),
  };
});

// Method to update order status
OrderSchema.methods.updateStatus = async function(status, note = "", updatedBy = "system") {
  this.orderStatus = status;
  this.statusHistory.push({
    status,
    note,
    updatedBy,
    timestamp: new Date(),
  });
  
  // If status is delivered, set delivery date
  if (status === "delivered" && !this.deliveryDate) {
    this.deliveryDate = new Date();
  }
  
  await this.save();
  return this;
};

// Method to update payment status
OrderSchema.methods.updatePaymentStatus = async function(status, paymentDetails = {}) {
  this.paymentStatus = status;
  this.paymentDetails = { ...this.paymentDetails, ...paymentDetails };
  await this.save();
  return this;
};

// Method to add SSL Commerce response data
OrderSchema.methods.addSSLData = async function(sslData) {
  this.sslData = sslData;
  if (sslData.status === "VALID" || sslData.status === "VALIDATED") {
    this.paymentStatus = "completed";
  } else if (sslData.status === "FAILED") {
    this.paymentStatus = "failed";
  }
  await this.save();
  return this;
};

// Pre-save middleware to ensure orderId exists
OrderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    this.orderId = await this.constructor.generateOrderId();
  }
  next();
});

// Post-save middleware to log order creation
OrderSchema.post('save', function(doc) {
  console.log(`Order ${doc.orderId} created successfully`);
});

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

export default Order;