const {
  createProductSRV,
  getAllProductSRV,
  getProductByIdSRV,
  deleteProductSRV,
  updateSizeQuantitySRV,
  removeSizeFromProductSRV,
  getProductSizesSRV,
  updateProductSRV,
} = require("../services/product.service");

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
      message:
        result.message ||
        (result.success
          ? "Products fetched successfully"
          : "Failed to fetch products"),
      data: result.data,
      pagination: result.pagination,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error("Get all products controller error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
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
      data: null,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const result = await updateProductSRV(id, updateData);
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return;
    }
  } catch (error) {}
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteProductSRV(id);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

const addSizeToProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await addSizeToProductSRV(id, req.body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

const updateSizeQuantity = async (req, res) => {
  try {
    const { id, sizeName } = req.params;
    const { quantity } = req.body;
    const result = await updateSizeQuantitySRV(id, sizeName, quantity);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

const removeSizeFromProduct = async (req, res) => {
  try {
    const { id, sizeName } = req.params;
    const result = await removeSizeFromProductSRV(id, sizeName);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

const getProductSizes = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getProductSizesSRV(id);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};
const addReviewController = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // prevent duplicate review
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.userId.toString() === req.user.id
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        message: "You already reviewed this product",
      });
    }

    const review = {
      user: {
        userId: req.user.id,
        name: req.user.name,
      },
      rating: Number(rating),
      comment,
      verifiedPurchase: true, // you can replace with order check later
    };

    product.reviews.push(review);

    // UPDATE STATS
    product.totalReviews = product.reviews.length;

    product.averageRating =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) /
      product.reviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: review,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createProduct,
  getAllProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  addSizeToProduct,
  updateSizeQuantity,
  removeSizeFromProduct,
  getProductSizes,
  addReviewController
};
