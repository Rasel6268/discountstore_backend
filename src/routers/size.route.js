const express = require("express");

const verifyToken = require("../middleware/verifyToken");
const AdminVerify = require("../middleware/AdminVerify");
const {
  createSizeController,
  getAllSizeController,
  updateSizeController,
  deleteSizeController
} = require("../controllers/size.controller");
const router = express.Router();

router.post("/create", verifyToken, AdminVerify, createSizeController);
router.get("/all", verifyToken, getAllSizeController);
router.put("/update/:id", verifyToken, AdminVerify, updateSizeController);
router.delete("/delete/:id",verifyToken,AdminVerify,deleteSizeController)

module.exports = router;
