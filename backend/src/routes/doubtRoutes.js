const router = require('express').Router();
const dc = require('../controllers/doubtController');
const rc = require('../controllers/replyController');
const authMiddleware = require('../middleware/authMiddleware');
const { doubtRateLimit } = require('../middleware/rateLimitMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', dc.getDoubts);
router.post('/', authMiddleware, doubtRateLimit, upload.single('image'), dc.createDoubt);
router.get('/popular', dc.getPopularDoubts);
router.get('/recent', dc.getRecentDoubts);
router.get('/unsolved', dc.getUnsolvedDoubts);
router.get('/my', authMiddleware, dc.getMyDoubts);
router.get('/:id', dc.getDoubtById);
router.put('/:id', authMiddleware, dc.updateDoubt);
router.delete('/:id', authMiddleware, dc.deleteDoubt);
router.patch('/:id/solve', authMiddleware, dc.solveDoubt);
router.post('/:id/view', dc.incrementView);
router.get('/:id/replies', rc.getReplies);
router.post('/:id/replies', authMiddleware, rc.createReply);

module.exports = router;