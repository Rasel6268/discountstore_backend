// models/Coupon.model.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'free_shipping'],
    default: 'percentage'
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchase: {
    type: Number,
    default: 0,
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  perUserLimit: {
    type: Number,
    default: 1
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'draft'],
    default: 'active'
  },
  applicableProducts: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Product',
    default: null // null means all products
  },
  applicableCategories: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Category',
    default: null
  },
  excludedProducts: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Product',
    default: []
  },
  userGroups: {
    type: [String],
    enum: ['all', 'new', 'returning', 'vip'],
    default: ['all']
  },
  usedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    discountAmount: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Check if coupon is valid
couponSchema.methods.isValid = function(userId = null) {
  const now = new Date();
  
  // Check status
  if (this.status !== 'active') return false;
  
  // Check date range
  if (this.startDate > now) return false;
  if (this.endDate < now) return false;
  
  // Check usage limit
  if (this.usageLimit && this.usedCount >= this.usageLimit) return false;
  
  // Check user limit
  if (userId && this.perUserLimit) {
    const userUsedCount = this.usedBy.filter(u => u.userId.toString() === userId).length;
    if (userUsedCount >= this.perUserLimit) return false;
  }
  
  return true;
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function(subtotal) {
  if (subtotal < this.minPurchase) {
    return { valid: false, message: `Minimum purchase of $${this.minPurchase} required` };
  }
  
  let discount = 0;
  
  if (this.type === 'percentage') {
    discount = (subtotal * this.value) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else if (this.type === 'fixed') {
    discount = this.value;
  } else if (this.type === 'free_shipping') {
    discount = 0; // Handle shipping separately
  }
  
  return {
    valid: true,
    discount: parseFloat(discount.toFixed(2)),
    type: this.type,
    message: `Coupon applied successfully!`
  };
};

// Mark coupon as used
couponSchema.methods.markAsUsed = async function(userId, orderId, discountAmount) {
  if (!this.isValid(userId)) {
    throw new Error('Coupon is no longer valid');
  }
  
  this.usedCount += 1;
  this.usedBy.push({
    userId,
    orderId,
    discountAmount,
    usedAt: new Date()
  });
  
  await this.save();
  return true;
};

// Auto-update status based on date
couponSchema.pre('save', async function () {
  const now = new Date();

  if (this.endDate < now && this.status === 'active') {
    this.status = 'expired';
  }
  this.updatedAt = now;
});

module.exports = mongoose.model('Coupon', couponSchema);