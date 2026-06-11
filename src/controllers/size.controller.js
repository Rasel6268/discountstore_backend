const {
  createSizeService,
  getAllSizesService,
  updateSizeService,
  deleteSizeService
} = require("../services/size.service");
const createSizeController = async (req, res) => {
  try {
    const result = await createSizeService(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
const getAllSizeController = async (req, res) => {
  try {
    const result = await getAllSizesService();
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
const updateSizeController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateSizeService(id, req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
const deleteSizeController = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteSizeService(id);
        if (!result.success) {
            return res.status(404).json(result);
        }
        return res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};
module.exports = {
  createSizeController,
  getAllSizeController,
  updateSizeController,
  deleteSizeController
};
