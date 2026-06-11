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
  sku: String,
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
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true },

    description: { type: String, required: true },
    shortDescription: String,

    regularPrice: { type: Number, required: true },
    discountPrice: Number,

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },

    sku: { type: String, required: true, unique: true },

    quantity: { type: Number, default: 0 },

    hasSizes: { type: Boolean, default: false },
    hasColors: { type: Boolean, default: false },

    sizes: [sizeSchema],
    colors: [colorSchema],

    images: [{ url: String, alt: String }],

    reviews: [reviewSchema],

    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// ================= SLUG =================
productSchema.pre("save", async function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name);
  }

  // auto calculate rating
  if (this.reviews.length > 0) {
    this.totalReviews = this.reviews.length;
    this.averageRating =
      this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
  } else {
    this.totalReviews = 0;
    this.averageRating = 0;
  }
});

module.exports = mongoose.model("Product", productSchema);
