const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const AdminVerify = require('../middleware/AdminVerify')
const { createDiscountController, getDiscountController, getActiveDiscountsController } = require('../controllers/discountOffer.controller')
const router =  express.Router()

router.post("/create",verifyToken,AdminVerify,createDiscountController)
router.get('/', getDiscountController);
router.get('/active', getActiveDiscountsController);


module.exports = router