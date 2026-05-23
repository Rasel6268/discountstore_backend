const { createColorService, getColorsService } = require("../services/color.service");

const createColorController = async (req, res) => {
  try {
    const result = await createColorService(req.body);
    return res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
const getColorsController = async (req, res) => {
  try {
    const result = await getColorsService();
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  createColorController,
  getColorsController,
};
