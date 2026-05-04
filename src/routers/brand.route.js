const express = require('express')
const { createBrandController, allBrandController, getBrandByIdController, updateBrandController, deleteBrand } = require('../controllers/brand.controller')
const router = express.Router()

router.post('/create',createBrandController);
router.get('/',allBrandController)
router.get('/:id',getBrandByIdController)
router.put("/:id",updateBrandController)
router.delete('/:id',deleteBrand)

module.exports = router
