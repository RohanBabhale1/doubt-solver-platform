const router = require('express').Router();
const pc = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/stats', authMiddleware, pc.getMyStats);
router.get('/:userId', pc.getProfile);
router.put('/', authMiddleware, pc.updateProfile);
router.put('/avatar', authMiddleware, upload.single('avatar'), pc.uploadAvatar);
router.get('/:userId/doubts', pc.getUserDoubts);
router.get('/:userId/replies', pc.getUserReplies);

module.exports = router;