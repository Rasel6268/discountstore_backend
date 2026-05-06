const express = require('express');
const { createBrandController, allBrandController, getBrandByIdController, updateBrandController, deleteBrand, deleteBrandController } = require('../controllers/brand.controller');

const router = express.Router()

router.post('/', createBrandController);     
router.get('/', allBrandController);     
router.get('/:id', getBrandByIdController);    
router.put('/:id', updateBrandController);    
router.delete('/:id', deleteBrandController);  

module.exports = router