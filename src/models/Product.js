const mongoose = require("mongoose");
const slugify = require("../utils/slugify");

// ================= COLOR =================
const colorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  hexCode: { type: String, trim: true },
});

// ================= SIZE =================
const sizeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ["men", "women", "unisex", "kids"],
    default: "unisex",
  },
  quantity: { type: Number, default: 0, min: 0 },
  extraPrice: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
});


// ================= REVIEW =================
const reviewSchema = new mongoose.Schema(
  {
    user: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: String,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, minlength: 10 },
    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// ================= PRODUCT =================
const productSchema = new mongoose.Schema(
  {
    // ===== BASIC INFORMATION =====
    name: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      index: true 
    },
    slug: { 
      type: String, 
      unique: true,
      index: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    shortDescription: { 
      type: String,
      maxlength: 500 
    },

    // ===== PRICING =====
    regularPrice: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    discountPrice: { 
      type: Number, 
      min: 0 
    },
    discountPercentage: { 
      type: Number, 
      min: 0, 
      max: 100,
      default: 0 
    },
    costPerItem: { 
      type: Number, 
      min: 0 
    },
    profitMargin: { 
      type: Number, 
      min: 0, 
      max: 100,
      default: 0 
    },

    // ===== CATEGORIZATION =====
    category: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Category",
      required: true,
      index: true 
    },
    subcategory: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Subcategory",
      index: true 
    },
    brand: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Brand",
      index: true 
    },

    // ===== INVENTORY =====
    sku: { 
      type: String, 
      required: true, 
      unique: true,
      index: true 
    },
    quantity: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    lowStockThreshold: { 
      type: Number, 
      default: 10, 
      min: 0 
    },
    trackInventory: { 
      type: Boolean, 
      default: true 
    },
    allowBackorder: { 
      type: Boolean, 
      default: false 
    },

    // ===== SALES TRACKING =====
    totalSold: { 
      type: Number, 
      default: 0, 
      min: 0 
    },

    // ===== SIZE & COLOR =====
    hasSizes: { 
      type: Boolean, 
      default: false 
    },
    hasColors: { 
      type: Boolean, 
      default: false 
    },
    sizes: [sizeSchema],
    colors: [colorSchema],


    // ===== MEDIA =====
    images: [{
      url: { 
        type: String, 
        required: true 
      },
      alt: { 
        type: String,
        default: ""
      },
      isPrimary: { 
        type: Boolean, 
        default: false 
      }
    }],

    // ===== REVIEWS =====
    reviews: [reviewSchema],
    averageRating: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 5 
    },
    totalReviews: { 
      type: Number, 
      default: 0, 
      min: 0 
    },

    // ===== STATUS FLAGS =====
    isActive: { 
      type: Boolean, 
      default: true,
      index: true 
    },
    isFeatured: { 
      type: Boolean, 
      default: false,
      index: true 
    },
    isPremium: { 
      type: Boolean, 
      default: false 
    },
    isBest: { 
      type: Boolean, 
      default: false 
    },
    isPublished: { 
      type: Boolean, 
      default: false,
      index: true 
    },
    isFreeShipping: { 
      type: Boolean, 
      default: false 
    },
    status: { 
      type: String, 
      enum: ["active", "inactive", "draft", "archived"], 
      default: "draft",
      index: true 
    },

  
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


// ================= VIRTUALS =================
// Virtual: Calculate discount percentage
productSchema.virtual("calculatedDiscountPercentage").get(function() {
  if (!this.discountPrice || this.discountPrice >= this.regularPrice) return 0;
  return Math.round(((this.regularPrice - this.discountPrice) / this.regularPrice) * 100);
});

// Virtual: Check if product is in stock
productSchema.virtual("inStock").get(function() {
  return this.quantity > 0;
});

// Virtual: Check if product is low in stock
productSchema.virtual("isLowStock").get(function() {
  return this.quantity > 0 && this.quantity <= this.lowStockThreshold;
});

// Virtual: Get total available quantity across variants
productSchema.virtual("totalVariantQuantity").get(function() {
  if (!this.variants || this.variants.length === 0) return this.quantity;
  return this.variants.reduce((total, variant) => total + variant.quantity, 0);
});


productSchema.pre("save", async function () {
  // Generate slug if name is modified
  if (this.isModified("name")) {
    this.slug = slugify(this.name);
  }

  // Auto-calculate discount percentage
  if (this.discountPrice && this.discountPrice < this.regularPrice) {
    this.discountPercentage = Math.round(
      ((this.regularPrice - this.discountPrice) / this.regularPrice) * 100
    );
  } else {
    this.discountPercentage = 0;
  }

  // Auto-calculate profit margin
  if (this.costPerItem && this.regularPrice) {
    this.profitMargin = Math.round(
      ((this.regularPrice - this.costPerItem) / this.regularPrice) * 100
    );
  }
});



// ================= METHODS =================
// Instance method: Check if product has enough stock
productSchema.methods.hasEnoughStock = function(quantity) {
  return this.quantity >= quantity;
};

// Instance method: Reduce stock
productSchema.methods.reduceStock = function(quantity) {
  if (!this.hasEnoughStock(quantity)) {
    throw new Error("Insufficient stock");
  }
  this.quantity -= quantity;
  this.totalSold += quantity;
};

// Instance method: Increase stock
productSchema.methods.increaseStock = function(quantity) {
  this.quantity += quantity;
};

// Instance method: Add review
productSchema.methods.addReview = function(reviewData) {
  this.reviews.push(reviewData);
  this.totalReviews = this.reviews.length;
  this.averageRating = 
    this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
};
// ================= EXPORT =================
module.exports = mongoose.model("Product", productSchema);