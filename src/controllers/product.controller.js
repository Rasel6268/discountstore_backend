const { createProductSRV, getAllProductSRV, getProductByIdSRV } = require("../services/product.service");

const createProduct = async (req, res) => {
    
  try {
    const result = await createProductSRV(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server Error",
    });
  }
};
const getAllProduct = async (req, res) => {
  try {
    const result = await getAllProductSRV(req.query);
    
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message || (result.success ? "Products fetched successfully" : "Failed to fetch products"),
      data: result.data,
      pagination: result.pagination,
      count: result.count
    });
  } catch (error) {
    console.error("Get all products controller error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null
    });
  }
};
const getProductById = async (req, res) => {
   try {
    const { id } = req.params;
    const result = await getProductByIdSRV(id);
    return res.status(result.statusCode).json(result);
   } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null
    });
   }
};
const updateProduct = async (req, res) => {};
const deleteProduct = async () => {};

module.exports = {
  createProduct,
  getAllProduct,
  getProductById,
  updateProduct,
  deleteProduct,
};
