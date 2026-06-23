const mongoose = require("mongoose");
const slugify = require("../utils/slugify");

// ================= COLOR =================
const colorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
});

// ================= SIZE =================
const sizeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0,
  },
});

// ================= REVIEW =================
const reviewSchema = new mongoose.Schema(
  {
    user: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      name: String,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      minlength: 10,
    },
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ================= PRODUCT =================
const productSchema = new mongoose.Schema(
  {
    // ===== BASIC INFO =====
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
    },

    // ===== PRICING =====
    regularPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      min: 0,
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ===== CATEGORY =====
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      index: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      index: true,
    },

    // ===== INVENTORY =====
    sku: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },

    trackInventory: {
      type: Boolean,
      default: true,
    },

    // ===== VARIANTS =====
    hasSizes: {
      type: Boolean,
      default: false,
    },

    hasColors: {
      type: Boolean,
      default: false,
    },

    sizes: [sizeSchema],

    colors: [colorSchema],

    // ===== IMAGES =====
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
          default: "",
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // ===== REVIEWS =====
    reviews: [reviewSchema],

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    // ===== FLAGS =====
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    isFreeShipping: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "draft", "archived"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ================= VIRTUALS =================
productSchema.virtual("inStock").get(function () {
  return this.quantity > 0;
});

productSchema.virtual("isLowStock").get(function () {
  return (
    this.quantity > 0 &&
    this.quantity <= this.lowStockThreshold
  );
});

// ================= HELPER FUNCTIONS =================
const calculateDiscountPercentage = (regularPrice, discountPrice) => {
  if (!regularPrice || regularPrice <= 0) return 0;
  if (!discountPrice || discountPrice <= 0) return 0;
  if (discountPrice >= regularPrice) return 0;
  
  return Math.round(
    ((regularPrice - discountPrice) / regularPrice) * 100
  );
};

const calculateTotalQuantity = (sizes) => {
  if (!sizes || !Array.isArray(sizes) || sizes.length === 0) return 0;
  return sizes.reduce((total, size) => total + (parseInt(size.quantity) || 0), 0);
};

// ================= PRE SAVE =================
productSchema.pre("save", async function() {  // ← Remove 'next' parameter
  try {
    // slug
    if (this.isModified("name") && this.name) {
      this.slug = slugify(this.name);
    }

    // discount
    this.discountPercentage = calculateDiscountPercentage(
      this.regularPrice,
      this.discountPrice
    );

    // reviews stats
    if (this.reviews && this.reviews.length > 0) {
      this.totalReviews = this.reviews.length;
      
      this.averageRating = this.reviews.reduce(
        (sum, r) => sum + (r.rating || 0),
        0
      ) / this.reviews.length;
      
      this.averageRating = Math.round(this.averageRating * 10) / 10;
    } else {
      this.totalReviews = 0;
      this.averageRating = 0;
    }

    // No need to call next() - just return
  } catch (error) {
    // In async middleware, throw error instead of passing to next
    throw error;
  }
});

// ================= PRE FINDONEANDUPDATE =================
productSchema.pre('findOneAndUpdate', async function() {  // ← Remove 'next' parameter
  try {
    const update = this.getUpdate();
    const filter = this.getFilter();
    
    // Get the current document
    const doc = await this.model.findOne(filter);
    if (!doc) {
      throw new Error('Document not found');
    }

    // Determine what fields are being updated
    const regularPrice = update.regularPrice !== undefined ? update.regularPrice : doc.regularPrice;
    const discountPrice = update.discountPrice !== undefined ? update.discountPrice : doc.discountPrice;
    const name = update.name || doc.name;
    const sizes = update.sizes || doc.sizes;
    const hasSizes = update.hasSizes !== undefined ? update.hasSizes : doc.hasSizes;

    // Calculate and update discount percentage
    const discountPercentage = calculateDiscountPercentage(regularPrice, discountPrice);
    
    // Use $set to ensure the field is properly updated
    if (!update.$set) {
      update.$set = {};
    }
    update.$set.discountPercentage = discountPercentage;

    // Update slug if name changed
    if (update.name && update.name !== doc.name && update.name) {
      update.$set.slug = slugify(update.name);
    }

    // Update quantity based on sizes if hasSizes is true
    if (hasSizes && sizes && Array.isArray(sizes) && sizes.length > 0) {
      const totalQuantity = calculateTotalQuantity(sizes);
      update.$set.quantity = totalQuantity;
    } else if (!hasSizes) {
      // If hasSizes is false, don't calculate from sizes
      // Keep existing quantity or use provided quantity
      if (update.quantity === undefined) {
        update.$set.quantity = doc.quantity;
      }
    }

    // Remove duplicate fields from update if they're in $set
    if (update.discountPercentage !== undefined && update.$set.discountPercentage !== undefined) {
      delete update.discountPercentage;
    }
    if (update.slug !== undefined && update.$set.slug !== undefined) {
      delete update.slug;
    }
    if (update.quantity !== undefined && update.$set.quantity !== undefined) {
      delete update.quantity;
    }

    // Set runValidators and context
    this.options.runValidators = true;
    this.options.context = 'query';

    // No need to call next() - return or just let it complete
  } catch (error) {
    // In async middleware, throw error or return rejected promise
    throw error;
  }
});


// ================= EXPORT =================
module.exports = mongoose.model("Product", productSchema);