const mongoose = require("mongoose");

const sizeItemSchema = new mongoose.Schema({
  size: {
    type: String,
    required: [true, "Size name is required"],
    trim: true,
  },
  extraPrice: {
    type: Number,
    default: 0,
    min: [0, "Extra price cannot be negative"],
  }
});

const sizeGroupSchema = new mongoose.Schema(
  {
    SizeType: {
        type: String,
        enum: ["Men's", "Women's", "Unisex", "Kids"]
    },
    size: [sizeItemSchema],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Size", sizeGroupSchema);