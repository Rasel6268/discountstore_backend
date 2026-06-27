const {
  createSizeGroupService,
  getAllSizesService,
  addSizeToGroupService,
  updateSizeInGroupService,
  removeSizeFromGroupService,
  updateSizeGroupService,
  deleteSizeGroupService,
} = require("../services/size.service");

// Create a new size group
const createSizeGroup = async (req, res) => {
  try {
    const result = await createSizeGroupService(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get all size groups
const getAllSizes = async (req, res) => {
  try {
    const result = await getAllSizesService();
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Add size to group
const addSizeToGroup = async (req, res) => {
  try {
    const { sizeType, sizeName, extraPrice } = req.body;
    const result = await addSizeToGroupService(sizeType, sizeName, extraPrice);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Update size in group
const updateSizeInGroup = async (req, res) => {
  try {
    const { sizeType, oldSizeName, sizeName, extraPrice } = req.body;
    const result = await updateSizeInGroupService(sizeType, oldSizeName, {
      size: sizeName,
      extraPrice,
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Remove size from group
const removeSizeFromGroup = async (req, res) => {
  try {
    const { sizeType, sizeName } = req.body;
    const result = await removeSizeFromGroupService(sizeType, sizeName);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Update entire size group
const updateSizeGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateSizeGroupService(id, req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Delete size group
const deleteSizeGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteSizeGroupService(id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

module.exports = {
  createSizeGroup,
  getAllSizes,
  addSizeToGroup,
  updateSizeInGroup,
  removeSizeFromGroup,
  updateSizeGroup,
  deleteSizeGroup,
};