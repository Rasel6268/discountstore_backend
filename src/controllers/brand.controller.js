const {
  createBrandService,
  getAllBrandServices,
  getBrandByIdServices,
  updateBrand,
} = require("../services/brand.service");

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

const allBrandController = async (req, res) => {
  try {
    const result = await getAllBrandServices();
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};
const getBrandByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getBrandByIdServices(id);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
const updateBrandController = async(req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const result = await updateBrand(id,data)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({
        success: false,
        error: error.message || "Internal server Error"
    })
  }
};
const deleteBrand = (req, res) => {};

module.exports = {
  createBrandController,
  allBrandController,
  getBrandByIdController,
  updateBrandController,
  deleteBrand,
};
