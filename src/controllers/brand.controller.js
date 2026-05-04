const { createBrandService } = require("../services/brand.service")

const createBrandController = async (req, res) => {
  try {
    const result = await createBrandService(req.body);
    
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error("Controller error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
      statusCode: 500,
      data: null,
    });
  }
};

const allBrandController = (req,res) => {

}
const getBrandByIdController = (req,res) => {

}
const updateBrandController = (req,res) => {

}
const deleteBrand = (req,res) => {

}


module.exports = {
    createBrandController,
    allBrandController,
    getBrandByIdController,
    updateBrandController,
    deleteBrand
}