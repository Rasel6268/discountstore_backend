const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      default: "Get up to 50% off on fusion leather collection + Free Gift",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "expired", "draft"],
      default: "active",
    },

    // 🔥 Proper relation with Coupon model
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    offerType: {
      type: String,
      enum: ["limited_time_offer", "seasonal", "clearance", "flash_sale"],
      default: "limited_time_offer",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Discount", discountSchema);

discountSchema.pre("save", async function () {
  const now = new Date();
  if (this.endDate < now) {
    this.status = "expired";
  } else if (this.startDate > now) {
    this.status = "draft";
  } else {
    this.status = "active";
  }
});
