const exptess = require("express");
const router = exptess.Router();
const { createOrder, getOrderById, getUserOrders, getAllOrders } = require("../controllers/order.controller");

// Create a new order

router.post("/cod",createOrder);
router.get("/allorder", getAllOrders);
router.get("/:orderId", getOrderById);



module.exports = router