const Product = require("../models/Product");

const createProductSRV = async (body) => {
  try {
    const { name, sku, regularPrice, discountPrice } = body;
    if (discountPrice && discountPrice >= regularPrice) {
      return {
        success: false,
        error: "Discount price must be less than regular price",
        statusCode: 400,
        data: null,
      };
    }
    const existingProduct = await Product.findOne({
      $or: [{ name: { $regex: new RegExp(`^${name}$`, "i") } }, { sku: sku }],
    });
    if (existingProduct) {
      return {
        success: false,
        error: "Product with same name or SKU already exists",
        statusCode: 400,
        data: null,
      };
    }
    const product = new Product(body);
    await product.save();

    return {
      success: true,
      message: "Product created successfully",
      data: product,
      statusCode: 201,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      statusCode: 500,
      data: null,
    };
  }
};
const getAllProductSRV = async (filters = {}) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      isOnSale,
      status,
      isFeatured,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = filters;

    let query = {};

    // Search
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Filters
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (status) query.status = status;
    if (isFeatured === "true") query.isFeatured = true;

    // Price filter with discount consideration
    if (minPrice || maxPrice) {
      query.$or = [{ regularPrice: {} }, { discountPrice: {} }];

      if (minPrice) {
        query.$or[0].regularPrice.$gte = parseFloat(minPrice);
        query.$or[1].discountPrice.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.$or[0].regularPrice.$lte = parseFloat(maxPrice);
        query.$or[1].discountPrice.$lte = parseFloat(maxPrice);
      }
    }

    // On sale filter
    if (isOnSale === "true") {
      const now = new Date();
      query.discountPrice = { $ne: null, $lt: "$regularPrice" };
      query.$or = [
        { discountStartDate: { $lte: now } },
        { discountStartDate: null },
      ];
      query.$or = [
        { discountEndDate: { $gte: now } },
        { discountEndDate: null },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .populate("brand", "name slug")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    return {
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error getting products:", error);
    return {
      success: false,
      error: error.message,
      statusCode: 500,
      data: null,
    };
  }
};

const getProductByIdSRV = async (id) => {
  try {
    const product = await Product.findById(id)
      .populate("category", "name slug")
      .populate("brand", "name slug");

    if (!product) {
      return {
        success: false,
        error: "Product not found",
        statusCode: 404,
        data: null,
      };
    }

    return {
      success: true,
      data: product,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      statusCode: 500,
      data: null,
    };
  }
};
const updateProductSRV = async () => {};
const deleteProductSRV = async (id) => {
  try {
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return {
        success: false,
        error: "Product not found",
        statusCode: 404,
        data: null,
      };
    }

    return {
      success: true,
      message: "Product deleted successfully",
      data: product,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      statusCode: 500,
      data: null,
    };
  }
};
module.exports = {
  createProductSRV,
  getAllProductSRV,
  getProductByIdSRV,
  updateProductSRV,
  deleteProductSRV,
};
