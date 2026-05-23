const express = require('express')
const { createColorController, getColorsController } = require('../controllers/color.controller')
const router = express.Router()

router.post('/create', createColorController)
router.get('/all', getColorsController)

module.exports = router