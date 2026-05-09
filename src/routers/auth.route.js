const express = require('express')
const { register, login, logout, authMe, editProfile } = require('../controllers/auth.controller')
const verifyToken = require('../middleware/verifyToken')
const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout) 
router.put('/edit_profile', verifyToken, editProfile) 

router.get('/me', verifyToken, authMe )

module.exports = router