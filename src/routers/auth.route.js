const express = require('express')
const { register, login, logout, authMe, editProfile, getAllUsers, makeAdminController, deleteUserController } = require('../controllers/auth.controller')
const verifyToken = require('../middleware/verifyToken')
const AdminVerify = require('../middleware/AdminVerify')
const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', verifyToken, logout) 
router.put('/edit_profile', verifyToken, editProfile) 
router.get("/all-users", verifyToken, AdminVerify, getAllUsers)

router.get('/me', verifyToken, authMe)
router.put('/make-admin/:userId', verifyToken, AdminVerify, makeAdminController)
router.delete('/users/:userId', verifyToken, AdminVerify, deleteUserController)
router.delete('/:userId', verifyToken, AdminVerify, deleteUserController)

module.exports = router