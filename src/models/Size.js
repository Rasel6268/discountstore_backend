// models/size.model.js
const mongoose = require("mongoose");

const sizeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Size name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Size type is required"],
      enum: ["mens", "womens", "unisex", "kids"],
      default: "mens",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    extraPrice: {
      type: Number,
      default: 0,
      min: [0, "Extra price cannot be negative"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Size", sizeSchema);
