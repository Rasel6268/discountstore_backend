const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  getOrdersById,
  trackOrder,
  cancelOrder,
  changeOrder,
} = require("../controllers/order.controller");
const verifyToken = require("../middleware/verifyToken");
const AdminVerify = require("../middleware/AdminVerify");

// ==========================================
// PUBLIC ORDER TRACKING ENDPOINTS
// ==========================================
router.get("/track/:orderId", trackOrder);
router.get("/track", trackOrder);
router.post("/track", trackOrder);

// ==========================================
// CUSTOMER CANCELLATION & MODIFICATION (BEFORE PROCESSING)
// ==========================================
router.put("/cancel/:orderId", cancelOrder);
router.post("/cancel/:orderId", cancelOrder);
router.put("/change/:orderId", changeOrder);
router.post("/change/:orderId", changeOrder);

// ==========================================
// ORDER LIFECYCLE ENDPOINTS
// ==========================================
router.post("/cod", createOrder);
router.get("/allorder", getAllOrders);
router.get("/myorder/:id", verifyToken, getOrdersById);
router.get("/myorder", verifyToken, getOrdersById);
router.get("/user/:id", verifyToken, getOrdersById);
router.put("/update-status/:orderId", verifyToken, AdminVerify, updateOrderStatus);

// Order details by orderId (supports both authenticated & guest confirmation)
router.get("/:orderId", getOrderById);

module.exports = router;
