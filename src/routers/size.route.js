const express = require("express");
const router = express.Router();
const {
  createSizeGroup,
  getAllSizes,
  addSizeToGroup,
  updateSizeInGroup,
  removeSizeFromGroup,
  updateSizeGroup,
  deleteSizeGroup,
} = require("../controllers/size.controller");

// Create a new size group
router.post("/create", createSizeGroup);

// Get all size groups
router.get("/all", getAllSizes);

// Add size to existing group
router.put("/add-size", addSizeToGroup);

// Update size in group
router.put("/update-size", updateSizeInGroup);

// Remove size from group
router.put("/remove-size", removeSizeFromGroup);

// Update entire size group
router.put("/update/:id", updateSizeGroup);

// Delete size group
router.delete("/delete/:id", deleteSizeGroup);

module.exports = router;