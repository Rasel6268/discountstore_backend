const exptess = require("express");
const router = exptess.Router();
const { createOrder, getOrderById } = require("../controllers/order.controller");

// Create a new order

router.post("/cod",createOrder);
router.get("/:orderId", getOrderById);
// router.get("/user/orders", getUserOrders);
// router.put("/:orderId/status", updateOrderStatus);
// router.put("/:orderId/payment-status", updatePaymentStatus);
// router.delete("/:orderId/cancel", cancelOrder);

module.exports = router