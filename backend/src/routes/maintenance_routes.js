// routes/maintenance_routes.js
const router = require('express').Router();
const maintenanceController = require('../controllers/maintenance_controller');
const { authMiddleware } = require('../middleware/auth_middleware');
const { isAdmin } = require('../middleware/role_middleware');
const maintenanceUpload = require('../middleware/maintenance_upload_middleware'); // ✅ แก้ import

router.get('/', authMiddleware, isAdmin, maintenanceController.getReports);
router.post('/', authMiddleware, isAdmin, maintenanceUpload.single('image'), maintenanceController.addReport);
router.patch('/:id/status', authMiddleware, isAdmin, maintenanceController.toggleStatus);

module.exports = router;