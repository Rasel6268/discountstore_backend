// controllers/order.controller.js
const { 
  createOrderSRV, 
  getOrderByIdSRV, 
  getUserOrdersSRV,
  updateOrderStatusSRV,
  updatePaymentStatusSRV,
  cancelOrderSRV,
  getAllOrdersSRV
} = require("../services/order.service");

/**
 * Create a new order
 */
const createOrder = async (req, res) => {
  try {

    const result = await createOrderSRV(req.body);
    
    return res.status(result.statusCode || 201).json({
      success: result.success,
      message: result.message,
      data: result.data,
      orderId: result.orderId,
      errors: result.errors || null
    });
  } catch (error) {
    console.error("Create order controller error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null
    });
  }
};

/**
 * Get order by ID
 */
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id; // If using auth middleware
    
    const result = await getOrderByIdSRV(orderId, userId);
    
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
const allorder = async (req, res) => {
  try {
    const result = await getAllOrdersSRV(); 
    return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        data: result.data
    });
    } catch (error) {
    return res.status(500).json({
        success: false,     
        message: error.message || "Internal server error",
        data: null
    })}
}
/**
 * Get user's orders
 */
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    
    const { page, limit, status } = req.query;
    const result = await getUserOrdersSRV(userId, { page, limit, status });
    
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update order status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note, updatedBy } = req.body;
    
    const result = await updateOrderStatusSRV(orderId, status, note, updatedBy || "admin");
    
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update payment status
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, transactionId } = req.body;
    
    const result = await updatePaymentStatusSRV(orderId, paymentStatus, transactionId);
    
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Cancel order
 */
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, cancelledBy } = req.body;
    
    const result = await cancelOrderSRV(orderId, reason, cancelledBy || "customer");
    
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all orders (admin only)
 */
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (status) query.orderStatus = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const Order = require("../models/Order");
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user.userId", "name email phone")
        .populate("items.productId", "name images"),
      Order.countDocuments(query)
    ]);
    
    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder
};