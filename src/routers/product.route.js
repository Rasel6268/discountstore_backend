const express = require("express");
const {
  createProduct,
  getAllProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  addSizeToProduct,
  updateSizeQuantity,
  removeSizeFromProduct,
  getProductSizes,
  addProductReview,
} = require("../controllers/product.controller");
const verifyToken = require("../middleware/verifyToken");
const AdminVerify = require("../middleware/AdminVerify");

const router = express.Router();

router.post("/", createProduct,verifyToken,AdminVerify);
router.get("/", getAllProduct);
router.get("/:id", getProductById);
router.put("/:id", updateProduct,verifyToken,AdminVerify);
router.delete("/:id",verifyToken,AdminVerify ,deleteProduct);
router.post('/:id/sizes', addSizeToProduct);
router.get('/:id/sizes', getProductSizes);
router.put('/:id/sizes/:sizeName/quantity', updateSizeQuantity);
router.delete('/:id/sizes/:sizeName', removeSizeFromProduct);
router.post("/:id/reviews", verifyToken,addProductReview);


module.exports = router;
