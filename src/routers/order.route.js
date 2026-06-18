const exptess = require("express");
const router = exptess.Router();
const { createOrder, getOrderById, getUserOrders, getAllOrders,updateOrderStatus, getOrdersById } = require("../controllers/order.controller");
const verifyToken = require("../middleware/verifyToken");
const AdminVerify = require("../middleware/AdminVerify");

// Create a new order

router.post("/cod",verifyToken,createOrder);
router.get("/allorder", getAllOrders);
router.get("/:orderId",verifyToken, getOrderById);
router.get("/myorder/:id",verifyToken,getOrdersById);
router.put("/update-status/:orderId",verifyToken,AdminVerify,updateOrderStatus);



module.exports = router