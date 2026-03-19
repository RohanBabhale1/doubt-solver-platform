const router = require('express').Router();
const rc = require('../controllers/replyController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:id', rc.getReplyById);
router.put('/:id', authMiddleware, rc.updateReply);
router.delete('/:id', authMiddleware, rc.deleteReply);
router.patch('/:id/accept', authMiddleware, rc.acceptReply);

module.exports = router;