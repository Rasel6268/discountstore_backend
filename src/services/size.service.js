const Size = require("../models/Size");

const createSizeService = async (sizeData) => {
  try {
    const existingSize = await Size.findOne({ name: sizeData.name });
    if (existingSize) {
      return {
        success: false,
        message: "Size with this name already exists",
      };
    }
    const newSize = new Size(sizeData);
    await newSize.save();
    return {
      success: true,
      message: "Size create successfull",
      newSize,
    };
  } catch (error) {
    return {
      success: false,
    };
  }
};
const getAllSizesService = async () => {
    try {
        const sizes = await Size.find().sort({ createdAt: -1 });
        return {
            success: true,
            data: sizes
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "Failed to fetch sizes"
        };
    }
};
const updateSizeService = async (id, updateData) => {
    try {
        const size = await Size.findById(id);
        if (!size) {
            return {
                success: false,
                message: "Size not found"
            };
        }

        // Check for duplicate name (excluding current size)
        if (updateData.name && updateData.name !== size.name) {
            const existingSize = await Size.findOne({ name: updateData.name });
            if (existingSize) {
                return {
                    success: false,
                    message: "Size with this name already exists"
                };
            }
        }

        const updatedSize = await Size.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        return {
            success: true,
            message: "Size updated successfully",
            data: updatedSize
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "Failed to update size"
        };
    }
};
const deleteSizeService = async (id) => {
    try {
        const size = await Size.findById(id);
        if (!size) {
            return {
                success: false,
                message: "Size not found"
            };
        }

        await Size.findByIdAndDelete(id);
        
        return {
            success: true,
            message: "Size deleted successfully"
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "Failed to delete size"
        };
    }
};
module.exports = {
  createSizeService,
  getAllSizesService,
  updateSizeService,
  deleteSizeService
};
