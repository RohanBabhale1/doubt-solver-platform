const router = require('express').Router();
const vc = require('../controllers/voteController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/replies/:id/vote', authMiddleware, vc.toggleVote);
router.get('/replies/:id/votes', vc.getVotes);
router.get('/my', authMiddleware, vc.getMyVotes);

module.exports = router;