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

// ================= SIZE ITEM =================
const sizeItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  type: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  extraPrice: {
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
  { timestamps: true },
);

// ================= HELPERS =================
const calculateDiscountPercentage = (regularPrice, discountPrice) => {
  if (!regularPrice || regularPrice <= 0) return 0;
  if (!discountPrice || discountPrice <= 0) return 0;
  if (discountPrice >= regularPrice) return 0;
  return Math.round(((regularPrice - discountPrice) / regularPrice) * 100);
};

const calculateTotalQuantity = (sizes) => {
  if (!sizes || !Array.isArray(sizes)) return 0;
  return sizes.reduce((total, item) => {
    return total + (parseInt(item.quantity) || 0);
  }, 0);
};

// ================= PRODUCT =================
const productSchema = new mongoose.Schema(
  {
    // BASIC INFO
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

    // PRICING
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

    // CATEGORY
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

    // INVENTORY
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

    // VARIANTS
    hasSizes: {
      type: Boolean,
      default: false,
    },

    hasColors: {
      type: Boolean,
      default: false,
    },

    sizes: [sizeItemSchema],

    colors: [colorSchema],

    // IMAGES
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: "" },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    // REVIEWS
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

    // FLAGS
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    isFreeShipping: { type: Boolean, default: false },
    isBest:{ type: Boolean, default: false },
    isPremium:{ type: Boolean, default: false },


    status: {
      type: String,
      enum: ["active", "inactive", "draft", "archived"],
      default: "draft",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ================= VIRTUALS =================
productSchema.virtual("inStock").get(function () {
  return this.quantity > 0;
});

productSchema.virtual("isLowStock").get(function () {
  return this.quantity > 0 && this.quantity <= this.lowStockThreshold;
});

// ================= PRE SAVE =================
productSchema.pre("save", async function () {
  try {
    // slug
    if (this.isModified("name")) {
      this.slug = slugify(this.name);
    }

    // discount
    this.discountPercentage = calculateDiscountPercentage(
      this.regularPrice,
      this.discountPrice,
    );

    // reviews
    if (this.reviews?.length > 0) {
      this.totalReviews = this.reviews.length;

      this.averageRating =
        this.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
        this.reviews.length;

      this.averageRating = Math.round(this.averageRating * 10) / 10;
    } else {
      this.totalReviews = 0;
      this.averageRating = 0;
    }
  } catch (error) {
    throw error;
  }
});

// ================= PRE UPDATE =================
productSchema.pre("findOneAndUpdate", async function () {
  try {
    const update = this.getUpdate();
    const filter = this.getFilter();

    const doc = await this.model.findOne(filter);
    if (!doc) throw new Error("Document not found");

    const regularPrice = update.regularPrice ?? doc.regularPrice;
    const discountPrice = update.discountPrice ?? doc.discountPrice;
    const name = update.name ?? doc.name;
    const sizes = update.sizes ?? doc.sizes;
    const hasSizes = update.hasSizes ?? doc.hasSizes;

    const discountPercentage = calculateDiscountPercentage(
      regularPrice,
      discountPrice,
    );

    update.$set = update.$set || {};
    update.$set.discountPercentage = discountPercentage;

    // slug update
    if (update.name && update.name !== doc.name) {
      update.$set.slug = slugify(update.name);
    }

    // quantity from sizes
    if (hasSizes && sizes) {
      update.$set.quantity = calculateTotalQuantity(sizes);
    }

    this.options.runValidators = true;
    this.options.context = "query";
  } catch (error) {
    throw error;
  }
});

// ================= EXPORT =================
module.exports = mongoose.model("Product", productSchema);
