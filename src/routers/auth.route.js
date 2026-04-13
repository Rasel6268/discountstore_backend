const express = require('express')
const { register, login, logout, authMe } = require('../controllers/auth.controller')
const verifyToken = require('../middleware/verifyToken')
const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)  

router.get('/me', verifyToken, authMe )

module.exports = router