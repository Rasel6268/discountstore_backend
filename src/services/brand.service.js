const Brand = require("../models/Brand");
const User = require("../models/User");

const createBrandService = async (body) => {
  try {
    const { name } = body;
    
    // Check if brand already exists (fixed variable name)
    const isBrandExist = await Brand.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
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

const getAllBrandServices = () => {};
const getBrandByIdServices = (id) => {};
const updateBrand = (id) => {};
const deleteBrand = (id) => {};

module.exports = {
  createBrandService,
  getAllBrandServices,
  getBrandByIdServices,
  deleteBrand,
};
