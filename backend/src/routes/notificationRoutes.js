const router = require('express').Router();
const nc = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', nc.getNotifications);
router.get('/unread', nc.getUnread);
router.get('/count', nc.getUnreadCount);
router.patch('/read-all', nc.markAllRead);
router.patch('/:id/read', nc.markAsRead);
router.delete('/:id', nc.deleteNotification);

module.exports = router;