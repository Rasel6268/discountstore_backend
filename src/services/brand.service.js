const Brand = require("../models/Brand");
const User = require("../models/User");

const createBrandService = async (body) => {
  try {
    const { name } = body;

    // Check if brand already exists (fixed variable name)
    const isBrandExist = await Brand.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (isBrandExist) {
      return {
        success: false,
        error: "Brand already exists with this name",
        statusCode: 400,
        data: null,
      };
    }

    // Create new brand (fixed: removed duplicate creation)
    const brand = new Brand(body);
    await brand.save();

    return {
      success: true,
      message: "Brand created successfully",
      data: brand,
      statusCode: 201,
    };
  } catch (error) {
    // Added proper error handling
    console.error("Error creating brand:", error);
    return {
      success: false,
      error: error.message || "Failed to create brand",
      statusCode: 500,
      data: null,
    };
  }
};

const getAllBrandServices = async () => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    return {
      success: true,
      data: brands,
      count: brands.length,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to get brands",
      statusCode: 500,
    };
  }
};
const getBrandByIdServices = async (id) => {
  try {
    const brand = await Brand.findById(id);
    if (!brand) {
      return {
        success: false,
        error: "Brand not found",
        statusCode: 404,
        data: null,
      };
    }
    return {
      success: true,
      data: brand,
      statusCode: 200,
    };
  } catch (error) {}
};
const updateBrand = async (id, data) => {
  try {
    const updatedBrand = await Brand.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    return {
      success: true,
      message: "Brand updated successfully",
      data: updatedBrand,
      statusCode: 200,
    };
  } catch (error) {
    return {
        success: false,
        error: error.message || "Internal server Error"
    }
  }
};
const deleteBrand = (id) => {};

module.exports = {
  createBrandService,
  getAllBrandServices,
  getBrandByIdServices,
  deleteBrand,
  updateBrand,
};
