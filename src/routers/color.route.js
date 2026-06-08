const express = require('express')
const { createColorController, getColorsController } = require('../controllers/color.controller')
const verifyToken = require('../middleware/verifyToken')
const AdminVerify = require('../middleware/AdminVerify')
const router = express.Router()

router.post('/create', verifyToken, AdminVerify, createColorController)
router.get('/all', getColorsController)
module.exports = router