const Color = require("../models/Color");

const createColorService = async (colorData) => {
  const { name, hexCode } = colorData;
  const ExistingColor = await Color.findOne({ name: name.trim() });
  if (ExistingColor) {
    return {
      success: false,
      message: "Color with this name already exists",
    };
  }
  const newColor = new Color({
    name: name.trim(),
    hexCode: hexCode.trim(),
    isActive: true,
  });
  await newColor.save();
  return {
    success: true,
    message: "Color created successfully",
    data: newColor,
  };
};

const getColorsService = async () => {
  try {
    const colors = await Color.find({ isActive: true });
    return {
      success: true,
      data: colors,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Internal Server Error",
    };
  }
};

module.exports = {
  createColorService,
  getColorsService,
};
