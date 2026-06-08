const express = require('express');
const { createBrandController, allBrandController, getBrandByIdController, updateBrandController, deleteBrand, deleteBrandController } = require('../controllers/brand.controller');
const verifyToken = require('../middleware/verifyToken');
const AdminVerify = require('../middleware/AdminVerify');

const router = express.Router()

router.post('/',verifyToken,AdminVerify, createBrandController);     
router.get('/', allBrandController);     
router.get('/:id', getBrandByIdController);    
router.put('/:id', verifyToken, AdminVerify, updateBrandController);    
router.delete('/:id', verifyToken, AdminVerify, deleteBrandController);  

module.exports = router