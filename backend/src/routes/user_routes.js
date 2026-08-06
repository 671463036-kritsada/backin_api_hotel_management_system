const router = require('express').Router()
const userController = require('../controllers/user_controller')

const { authMiddleware } = require('../middleware/auth_middleware')
const { isAdmin } = require('../middleware/role_middleware')   

router.get('/', authMiddleware, isAdmin, userController.getUsers)
router.get('/not-allowed', authMiddleware, isAdmin, userController.getUsersNotAllowed)
router.patch('/allow', authMiddleware, isAdmin, userController.allowUser)
router.patch('/block', authMiddleware, isAdmin, userController.blockUser)
router.delete('/:id', authMiddleware, isAdmin, userController.deleteUser)

// user_routes.js
router.get('/me', authMiddleware, userController.getMyProfile)

module.exports = router