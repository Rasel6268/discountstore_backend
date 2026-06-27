const Size = require("../models/Size");

// Create a new size group
const createSizeGroupService = async (groupData) => {
  try {
    // Check if SizeType already exists
    const existingGroup = await Size.findOne({ SizeType: groupData.SizeType });
    if (existingGroup) {
      return {
        success: false,
        message: "Size type already exists",
      };
    }

    const newGroup = new Size(groupData);
    await newGroup.save();
    return {
      success: true,
      message: "Size group created successfully",
      data: newGroup,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to create size group",
    };
  }
};

// Get all size groups
const getAllSizesService = async () => {
  try {
    const sizes = await Size.find().sort({ createdAt: -1 });
    return {
      success: true,
      data: sizes,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to fetch sizes",
    };
  }
};

// Add size to existing group
const addSizeToGroupService = async (sizeType, sizeName, extraPrice = 0) => {
  try {
    const sizeGroup = await Size.findOne({ SizeType: sizeType });
    if (!sizeGroup) {
      return {
        success: false,
        message: "Size type not found",
      };
    }

    // Check if size already exists
    const sizeExists = sizeGroup.size.some((item) => item.size === sizeName);
    if (sizeExists) {
      return {
        success: false,
        message: "Size already exists in this group",
      };
    }

    sizeGroup.size.push({ size: sizeName, extraPrice });
    await sizeGroup.save();

    return {
      success: true,
      message: "Size added to group successfully",
      data: sizeGroup,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to add size to group",
    };
  }
};

// Update size in group
const updateSizeInGroupService = async (sizeType, oldSizeName, sizeData) => {
  try {
    const sizeGroup = await Size.findOne({ SizeType: sizeType });
    if (!sizeGroup) {
      return {
        success: false,
        message: "Size type not found",
      };
    }

    // Find the size index
    const sizeIndex = sizeGroup.size.findIndex((item) => item.size === oldSizeName);
    if (sizeIndex === -1) {
      return {
        success: false,
        message: "Size not found in this group",
      };
    }

    // Check if new size name conflicts with existing (only if name is being changed)
    if (oldSizeName !== sizeData.size) {
      const sizeExists = sizeGroup.size.some(
        (item) => item.size === sizeData.size
      );
      if (sizeExists) {
        return {
          success: false,
          message: "Size name already exists in this group",
        };
      }
    }

    // Update the size
    sizeGroup.size[sizeIndex] = {
      size: sizeData.size,
      extraPrice: sizeData.extraPrice || 0,
    };
    await sizeGroup.save();

    return {
      success: true,
      message: "Size updated successfully",
      data: sizeGroup,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to update size",
    };
  }
};

// Remove size from group
const removeSizeFromGroupService = async (sizeType, sizeName) => {
  try {
    const sizeGroup = await Size.findOne({ SizeType: sizeType });
    if (!sizeGroup) {
      return {
        success: false,
        message: "Size type not found",
      };
    }

    // Filter out the size
    const initialLength = sizeGroup.size.length;
    sizeGroup.size = sizeGroup.size.filter((item) => item.size !== sizeName);

    if (sizeGroup.size.length === initialLength) {
      return {
        success: false,
        message: "Size not found in this group",
      };
    }

    await sizeGroup.save();

    return {
      success: true,
      message: "Size removed from group successfully",
      data: sizeGroup,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to remove size from group",
    };
  }
};

// Update entire size group
const updateSizeGroupService = async (id, updateData) => {
  try {
    const sizeGroup = await Size.findById(id);
    if (!sizeGroup) {
      return {
        success: false,
        message: "Size group not found",
      };
    }

    // Check for duplicate SizeType (excluding current group)
    if (updateData.SizeType && updateData.SizeType !== sizeGroup.SizeType) {
      const existingGroup = await Size.findOne({
        SizeType: updateData.SizeType,
      });
      if (existingGroup) {
        return {
          success: false,
          message: "Size type already exists",
        };
      }
    }

    const updatedGroup = await Size.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return {
      success: true,
      message: "Size group updated successfully",
      data: updatedGroup,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to update size group",
    };
  }
};

// Delete entire size group
const deleteSizeGroupService = async (id) => {
  try {
    const sizeGroup = await Size.findById(id);
    if (!sizeGroup) {
      return {
        success: false,
        message: "Size group not found",
      };
    }

    await Size.findByIdAndDelete(id);

    return {
      success: true,
      message: "Size group deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to delete size group",
    };
  }
};

module.exports = {
  createSizeGroupService,
  getAllSizesService,
  addSizeToGroupService,
  updateSizeInGroupService,
  removeSizeFromGroupService,
  updateSizeGroupService,
  deleteSizeGroupService,
};