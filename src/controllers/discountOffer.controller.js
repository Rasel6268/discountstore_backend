const { 
  createDiscountOffer, 
  getDiscountOffers, 
  getDiscountOfferById,
  updateDiscountOffer,
  deleteDiscountOffer,
  getActiveDiscounts,
  updateDiscountStatus
} = require("../services/discountOffer.service");

// Create a new discount offer
exports.createDiscountController = async (req, res) => {
  try {
    const result = await createDiscountOffer(req.body);
    
    res.status(201).json({
      success: true,
      message: "Discount offer created successfully",
      result
    });
  } catch (error) {
    console.error("Error in createDiscountController:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    // Handle duplicate or other specific errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate discount offer found",
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create discount offer",
      error: error.message
    });
  }
};

// Get all discount offers
exports.getDiscountController = async (req, res) => {
  try {
    const { status, offerType, page = 1, limit = 10 } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (offerType) filters.offerType = offerType;
    
    const result = await getDiscountOffers(filters, parseInt(page), parseInt(limit));
    
    res.status(200).json({
      success: true,
      message: "Discount offers fetched successfully",
      data: result.discounts,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error in getDiscountController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch discount offers",
      error: error.message
    });
  }
};

// Get a single discount offer by ID
exports.getDiscountByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const discount = await getDiscountOfferById(id);
    console.log(discount)
    
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Discount offer not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Discount offer fetched successfully",
      data: discount
    });
  } catch (error) {
    console.error("Error in getDiscountByIdController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch discount offer",
      error: error.message
    });
  }
};

// Update a discount offer
exports.updateDiscountController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const discount = await updateDiscountOffer(id, updateData);
    
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Discount offer not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Discount offer updated successfully",
      data: discount
    });
  } catch (error) {
    console.error("Error in updateDiscountController:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to update discount offer",
      error: error.message
    });
  }
};
exports.updateDiscountStatusController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await updateDiscountStatus(id, req.body);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Discount not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Discount status updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update discount status",
      error: error.message,
    });
  }
};

// Delete a discount offer
exports.deleteDiscountController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteDiscountOffer(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Discount offer not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Discount offer deleted successfully",
      data: result
    });
  } catch (error) {
    console.error("Error in deleteDiscountController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete discount offer",
      error: error.message
    });
  }
};

// Get active discounts (for customers)
exports.getActiveDiscountsController = async (req, res) => {
  try {
    const discounts = await getActiveDiscounts();
    
    res.status(200).json({
      success: true,
      message: "Active discounts fetched successfully",
      data: discounts
    });
  } catch (error) {
    console.error("Error in getActiveDiscountsController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active discounts",
      error: error.message
    });
  }
};