const exptess = require("express");
const router = exptess.Router();
const { createOrder, getOrderById, getUserOrders, getAllOrders,updateOrderStatus } = require("../controllers/order.controller");

// Create a new order

router.post("/cod",createOrder);
router.get("/allorder", getAllOrders);
router.get("/:orderId", getOrderById);
router.put("/update-status/:orderId",updateOrderStatus);



module.exports = router