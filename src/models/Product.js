const mongoose = require("mongoose");
const slugify = require("../utils/slugify");

// Size Schema for individual size options
const sizeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // Size type: "men", "women", "unisex", "kids"
  type: {
    type: String,
    enum: ["men", "women", "unisex", "kids"],
    default: "unisex",
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
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
  isActive: {
    type: Boolean,
    default: true,
  },
});

const productSchema = new mongoose.Schema(
  {
    // ================= BASIC INFO =================
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      unique: true,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    // ================= PRICING =================
    regularPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    discountStartDate: Date,
    discountEndDate: Date,

    costPerItem: {
      type: Number,
      default: null,
      min: 0,
    },

    profitMargin: {
      type: Number,
      default: 0,
    },

    // ================= CATEGORY =================
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    // ================= INVENTORY =================
    sku: {
      type: String,
      required: true,
      unique: true,
    },

    // Base quantity (when not using sizes)
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Enable size-based inventory
    hasSizes: {
      type: Boolean,
      default: false,
    },

    // Size options array
    sizes: [sizeSchema],

    lowStockThreshold: {
      type: Number,
      default: 10,
    },

    trackInventory: {
      type: Boolean,
      default: true,
    },

    allowBackorder: {
      type: Boolean,
      default: false,
    },

    // ================= IMAGES =================
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: "" },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    // ================= VARIANTS =================
    variants: [
      {
        name: String,
        sku: String,
        regularPrice: Number,
        discountPrice: Number,
        quantity: Number,
        attributes: Map,
        images: [String],
      },
    ],

    // ================= STATUS =================
    status: {
      type: String,
      enum: ["draft", "active", "inactive", "archived"],
      default: "draft",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPremium : {
      type: Boolean,
      default: false,
    },
    isBest: {
      type: Boolean,
      default: false,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    publishedAt: Date,

    isFreeShipping: {
      type: Boolean,
      default: false,
    },

    // ================= REVIEWS =================
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

    // ================= SALES =================
    totalSold: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for total quantity from sizes
productSchema.virtual('totalQuantity').get(function() {
  if (this.hasSizes && this.sizes.length > 0) {
    return this.sizes.reduce((total, size) => total + size.quantity, 0);
  }
  return this.quantity;
});

// Virtual for available sizes (grouped by type)
productSchema.virtual('availableSizesByType').get(function() {
  if (!this.hasSizes) return null;
  
  const grouped = {
    men: [],
    women: [],
    unisex: [],
    kids: []
  };
  
  this.sizes.forEach(size => {
    if (size.isActive && size.quantity > 0) {
      grouped[size.type].push(size);
    }
  });
  
  return grouped;
});

// Pre-save middleware
productSchema.pre("save", async function() {
  // ================= SLUG =================
  if (this.isModified("name")) {
    let baseSlug = slugify(this.name);
    let slug = baseSlug;
    let counter = 1;

    while (
      await mongoose.model("Product").findOne({
        slug,
        _id: { $ne: this._id },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }

  // ================= DISCOUNT =================
  if (this.discountPrice && this.discountPrice < this.regularPrice) {
    this.discountPercentage =
      ((this.regularPrice - this.discountPrice) / this.regularPrice) * 100;

    this.discountPercentage =
      Math.round(this.discountPercentage * 100) / 100;
  } else {
    this.discountPercentage = 0;
    this.discountPrice = null;
  }

  // ================= PROFIT =================
  if (this.costPerItem && this.regularPrice) {
    this.profitMargin =
      ((this.regularPrice - this.costPerItem) / this.regularPrice) * 100;

    this.profitMargin = Math.round(this.profitMargin * 100) / 100;
  }

  // ================= PUBLISH DATE =================
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // ================= PRIMARY IMAGE =================
  if (this.images?.length) {
    const hasPrimary = this.images.some((img) => img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }
  }

  // ================= UPDATE BASE QUANTITY FROM SIZES =================
  if (this.hasSizes && this.sizes.length > 0) {
    this.quantity = this.sizes.reduce((total, size) => total + size.quantity, 0);
  }
});

module.exports = mongoose.model("Product", productSchema);