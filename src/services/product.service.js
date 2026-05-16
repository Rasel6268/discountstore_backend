const Product = require("../models/Product");

const createProductSRV = async (body) => {
  try {
    const { name, sku, regularPrice, discountPrice, hasSizes, sizes } = body;
    
    if (discountPrice && discountPrice >= regularPrice) {
      return {
        success: false,
        error: "Discount price must be less than regular price",
        statusCode: 400,
        data: null,
      };
    }
    
    // Validate sizes if provided
    if (hasSizes && sizes) {
      const sizeValidation = validateSizes(sizes);
      if (!sizeValidation.valid) {
        return {
          success: false,
          error: sizeValidation.error,
          statusCode: 400,
          data: null,
        };
      }
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
    
    // Calculate total quantity from sizes if hasSizes is true
    if (hasSizes && sizes && sizes.length > 0) {
      body.quantity = sizes.reduce((total, size) => total + (size.quantity || 0), 0);
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
const validateSizes = (sizes) => {
  if (!sizes || !Array.isArray(sizes)) return { valid: true };
  
  const sizeNames = new Set();
  for (const size of sizes) {
    // Check for duplicate size names
    if (sizeNames.has(size.name)) {
      return { valid: false, error: `Duplicate size name: ${size.name}` };
    }
    sizeNames.add(size.name);
    
    // Validate quantity
    if (size.quantity < 0) {
      return { valid: false, error: `Quantity cannot be negative for size: ${size.name}` };
    }
    
    // Validate extra price
    if (size.extraPrice < 0) {
      return { valid: false, error: `Extra price cannot be negative for size: ${size.name}` };
    }
  }
  
  return { valid: true };
};
const addSizeToProductSRV = async (productId, sizeData) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return {
        success: false,
        error: "Product not found",
        statusCode: 404,
        data: null,
      };
    }
    
    // Check if size already exists
    const sizeExists = product.sizes.some(s => s.name === sizeData.name);
    if (sizeExists) {
      return {
        success: false,
        error: `Size "${sizeData.name}" already exists for this product`,
        statusCode: 400,
        data: null,
      };
    }
    
    // Generate SKU for the size if not provided
    if (!sizeData.sku) {
      sizeData.sku = `${product.sku}-${sizeData.name.toUpperCase()}`;
    }
    
    product.sizes.push(sizeData);
    product.hasSizes = true;
    
    // Update total quantity
    product.quantity = product.sizes.reduce((total, s) => total + s.quantity, 0);
    
    await product.save();
    
    return {
      success: true,
      message: "Size added successfully",
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
const updateSizeQuantitySRV = async (productId, sizeName, quantity) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return {
        success: false,
        error: "Product not found",
        statusCode: 404,
        data: null,
      };
    }
    
    const sizeIndex = product.sizes.findIndex(s => s.name === sizeName);
    if (sizeIndex === -1) {
      return {
        success: false,
        error: `Size "${sizeName}" not found`,
        statusCode: 404,
        data: null,
      };
    }
    
    product.sizes[sizeIndex].quantity = quantity;
    product.quantity = product.sizes.reduce((total, s) => total + s.quantity, 0);
    
    await product.save();
    
    return {
      success: true,
      message: "Size quantity updated successfully",
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
// Remove size from product
const removeSizeFromProductSRV = async (productId, sizeName) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return {
        success: false,
        error: "Product not found",
        statusCode: 404,
        data: null,
      };
    }
    
    product.sizes = product.sizes.filter(s => s.name !== sizeName);
    
    if (product.sizes.length === 0) {
      product.hasSizes = false;
    }
    
    product.quantity = product.sizes.reduce((total, s) => total + s.quantity, 0);
    
    await product.save();
    
    return {
      success: true,
      message: "Size removed successfully",
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
// Get product sizes grouped by type
const getProductSizesSRV = async (productId) => {
  try {
    const product = await Product.findById(productId).select('sizes hasSizes name');
    if (!product) {
      return {
        success: false,
        error: "Product not found",
        statusCode: 404,
        data: null,
      };
    }
    
    const groupedSizes = {
      men: product.sizes.filter(s => s.type === 'men' && s.isActive),
      women: product.sizes.filter(s => s.type === 'women' && s.isActive),
      unisex: product.sizes.filter(s => s.type === 'unisex' && s.isActive),
      kids: product.sizes.filter(s => s.type === 'kids' && s.isActive),
    };
    
    return {
      success: true,
      data: {
        productName: product.name,
        hasSizes: product.hasSizes,
        sizes: groupedSizes,
        allSizes: product.sizes,
      },
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
  validateSizes,
  addSizeToProductSRV,
  updateSizeQuantitySRV,
  removeSizeFromProductSRV,
  getProductSizesSRV,
};
