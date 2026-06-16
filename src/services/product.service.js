const Product = require("../models/Product");

const createProductSRV = async (body) => {
  try {
    const {
      name,
      sku,
      regularPrice,
      discountPrice,
      hasSizes,
      sizes,
      hasColors,
      colors,
    } = body;

    // Validate discount price
    if (discountPrice && discountPrice >= regularPrice) {
      return {
        success: false,
        error: "Discount price must be less than regular price",
        statusCode: 400,
        data: null,
      };
    }

    // Validate sizes if enabled
    if (hasSizes && sizes && sizes.length > 0) {
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

    // Validate colors if enabled
    if (hasColors && colors && colors.length > 0) {
      const colorValidation = validateColors(colors);
      if (!colorValidation.valid) {
        return {
          success: false,
          error: colorValidation.error,
          statusCode: 400,
          data: null,
        };
      }
    }

    // Check for existing product
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

    // Calculate total quantity based on sizes or colors
    if (hasSizes && sizes && sizes.length > 0) {
      body.quantity = sizes.reduce(
        (total, size) => total + (size.quantity || 0),
        0,
      );
    }
    // Create product
    const product = new Product(body);
    await product.save();

    return {
      success: true,
      message: "Product created successfully",
      data: product,
      statusCode: 201,
    };
  } catch (error) {
    console.error("Create product error:", error);
    return {
      success: false,
      error: error.message,
      statusCode: 500,
      data: null,
    };
  }
};
// Validate colors function
const validateColors = (colors) => {
  if (!colors || !Array.isArray(colors)) return { valid: true };

  const colorIds = new Set();
  const colorNames = new Set();

  for (const color of colors) {
    // Check for duplicate color IDs
    if (color._id && colorIds.has(color._id)) {
      return { valid: false, error: `Duplicate color found` };
    }
    if (color._id) colorIds.add(color._id);

    // Check for duplicate color names
    if (color.name && colorNames.has(color.name)) {
      return { valid: false, error: `Duplicate color name: ${color.name}` };
    }
    if (color.name) colorNames.add(color.name);

    // Validate quantity
    if (color.quantity !== undefined && color.quantity < 0) {
      return {
        valid: false,
        error: `Quantity cannot be negative for color: ${color.name}`,
      };
    }

    // Validate hex code format (if provided)
    if (
      color.hexCode &&
      !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color.hexCode)
    ) {
      return {
        valid: false,
        error: `Invalid hex code format for color: ${color.name}`,
      };
    }
  }

  return { valid: true };
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
      limit = 12,
    } = filters;

    let query = {};

    // Search - search in name, description, and SKU
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter - handle array of category IDs
    if (category) {
      if (typeof category === "string" && category.includes(",")) {
        query.category = { $in: category.split(",") };
      } else if (Array.isArray(category)) {
        query.category = { $in: category };
      } else {
        query.category = category;
      }
    }

    // Brand filter - handle array of brand IDs
    if (brand) {
      if (typeof brand === "string" && brand.includes(",")) {
        query.brand = { $in: brand.split(",") };
      } else if (Array.isArray(brand)) {
        query.brand = { $in: brand };
      } else {
        query.brand = brand;
      }
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Featured filter
    if (isFeatured === "true") {
      query.isFeatured = true;
    }

    // Price filter
    if (minPrice || maxPrice) {
      query.regularPrice = {};
      if (minPrice) {
        query.regularPrice.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.regularPrice.$lte = parseFloat(maxPrice);
      }
    }

    // On sale filter
    if (isOnSale === "true") {
      query.discountPrice = { $ne: null, $gt: 0 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sorting
    let sort = {};
    switch (sortBy) {
      case "price_asc":
        sort.regularPrice = 1;
        break;
      case "price_desc":
        sort.regularPrice = -1;
        break;
      case "newest":
        sort.createdAt = -1;
        break;
      case "rating_desc":
        sort.averageRating = -1;
        break;
      case "featured":
        sort.isFeatured = -1;
        sort.createdAt = -1;
        break;
      default:
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

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
        pages: Math.ceil(total / parseInt(limit)),
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

const updateProductSRV = async (id, body) => {
  try {
    const {
      name,
      sku,
      regularPrice,
      discountPrice,
      hasSizes,
      sizes,
      hasColors,
      colors,
    } = body;

    // Find existing product
    const product = await Product.findById(id);
    if (!product) {
      return {
        success: false,
        error: "Product not found",
        statusCode: 404,
        data: null,
      };
    }

    // Validate discount price
    if (discountPrice && discountPrice >= regularPrice) {
      return {
        success: false,
        error: "Discount price must be less than regular price",
        statusCode: 400,
        data: null,
      };
    }

    // Validate sizes if enabled
    if (hasSizes && sizes && sizes.length > 0) {
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

    // Validate colors if enabled
    if (hasColors && colors && colors.length > 0) {
      const colorValidation = validateColors(colors);
      if (!colorValidation.valid) {
        return {
          success: false,
          error: colorValidation.error,
          statusCode: 400,
          data: null,
        };
      }
    }

    // Check for duplicate name/SKU (excluding current product)
    if ((name && name !== product.name) || (sku && sku !== product.sku)) {
      const existingProduct = await Product.findOne({
        $or: [
          ...(name && name !== product.name
            ? [{ name: { $regex: new RegExp(`^${name}$`, "i") } }]
            : []),
          ...(sku && sku !== product.sku ? [{ sku: sku }] : []),
        ],
        _id: { $ne: id },
      });

      if (existingProduct) {
        return {
          success: false,
          error: "Product with same name or SKU already exists",
          statusCode: 400,
          data: null,
        };
      }
    }

    // Calculate total quantity based on sizes or colors
    if (hasSizes && sizes && sizes.length > 0) {
      body.quantity = sizes.reduce(
        (total, size) => total + (size.quantity || 0),
        0,
      );
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true },
    );

    return {
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
      statusCode: 200,
    };
  } catch (error) {
    console.error("Update product error:", error);
    return {
      success: false,
      error: error.message,
      statusCode: 500,
      data: null,
    };
  }
};

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
    if (sizeNames.has(size.name)) {
      return { valid: false, error: `Duplicate size name: ${size.name}` };
    }
    sizeNames.add(size.name);

    if (size.quantity < 0) {
      return {
        valid: false,
        error: `Quantity cannot be negative for size: ${size.name}`,
      };
    }

    if (size.extraPrice < 0) {
      return {
        valid: false,
        error: `Extra price cannot be negative for size: ${size.name}`,
      };
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

    const sizeExists = product.sizes.some((s) => s.name === sizeData.name);
    if (sizeExists) {
      return {
        success: false,
        error: `Size "${sizeData.name}" already exists for this product`,
        statusCode: 400,
        data: null,
      };
    }

    if (!sizeData.sku) {
      sizeData.sku = `${product.sku}-${sizeData.name.toUpperCase()}`;
    }

    product.sizes.push(sizeData);
    product.hasSizes = true;
    product.quantity = product.sizes.reduce(
      (total, s) => total + s.quantity,
      0,
    );

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

    const sizeIndex = product.sizes.findIndex((s) => s.name === sizeName);
    if (sizeIndex === -1) {
      return {
        success: false,
        error: `Size "${sizeName}" not found`,
        statusCode: 404,
        data: null,
      };
    }

    product.sizes[sizeIndex].quantity = quantity;
    product.quantity = product.sizes.reduce(
      (total, s) => total + s.quantity,
      0,
    );

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

    product.sizes = product.sizes.filter((s) => s.name !== sizeName);

    if (product.sizes.length === 0) {
      product.hasSizes = false;
    }

    product.quantity = product.sizes.reduce(
      (total, s) => total + s.quantity,
      0,
    );

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

const getProductSizesSRV = async (productId) => {
  try {
    const product = await Product.findById(productId).select(
      "sizes hasSizes name",
    );
    if (!product) {
      return {
        success: false,
        error: "Product not found",
        statusCode: 404,
        data: null,
      };
    }

    const groupedSizes = {
      men: product.sizes.filter((s) => s.type === "men" && s.isActive),
      women: product.sizes.filter((s) => s.type === "women" && s.isActive),
      unisex: product.sizes.filter((s) => s.type === "unisex" && s.isActive),
      kids: product.sizes.filter((s) => s.type === "kids" && s.isActive),
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
const addProductReviewSRV = async (data) => {
  const {Product_id, userId, userName, rating, comment} = data
  console.log(Product_id)
  try {
    // Validate inputs
    if (!rating || rating < 1 || rating > 5) {
      return {
        success: false,
        error: "Rating must be between 1 and 5",
        statusCode: 400,
        data: null,
      };
    }

    if (!comment || comment.trim().length < 10) {
      return {
        success: false,
        error: "Review must be at least 10 characters",
        statusCode: 400,
        data: null,
      };
    }

    const product = await Product.findById(Product_id);
    if (!product) {
      return {
        success: false,
        error: "Product not found",
        statusCode: 404,
        data: null,
      };
    }

    // Check if user already reviewed
    const existingReview = product.reviews.find(
      (review) => review.user && review.user.userId && review.user.userId.toString() === userId.toString()
    );

    if (existingReview) {
      return {
        success: false,
        error: "You have already reviewed this product",
        statusCode: 400,
        data: null,
      };
    }

    // Create review object matching your schema
    const newReview = {
      user: {
        userId: userId,
        name: userName,
      },
      rating: Number(rating), // Ensure rating is a number
      comment: comment.trim(),
      verifiedPurchase: false,
    };

    // Add review to product
    product.reviews.push(newReview);
    
    // Save product (this will trigger the pre-save middleware to update ratings)
    await product.save();

    // Get the newly added review
    const addedReview = product.reviews[product.reviews.length - 1];

    return {
      success: true,
      message: "Review added successfully",
      data: {
        averageRating: product.averageRating,
        totalReviews: product.totalReviews,
        review: {
          user: {
            name: addedReview.user.name,
          },
          rating: addedReview.rating,
          comment: addedReview.comment,
          verifiedPurchase: addedReview.verifiedPurchase,
          createdAt: addedReview.createdAt,
        },
      },
      statusCode: 201,
    };
  } catch (error) {
    console.error("Error adding review:", error);
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
  addProductReviewSRV,
};
