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
} = require("../controllers/product.controller");

const router = express.Router();

router.post("/", createProduct);
router.get("/", getAllProduct);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.post('/:id/sizes', addSizeToProduct);
router.get('/:id/sizes', getProductSizes);
router.put('/:id/sizes/:sizeName/quantity', updateSizeQuantity);
router.delete('/:id/sizes/:sizeName', removeSizeFromProduct);

module.exports = router;
