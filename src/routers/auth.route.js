const express = require('express')
const { Register, Login, Logout, authMe } = require('../controllers/auth.controller')
const verifyToken = require('../middleware/verifyToken')
const router = express.Router()

router.post('/register', Register)
router.post('/login', Login)
router.post('/logout', Logout)  

router.get('/me', verifyToken, authMe )

module.exports = router