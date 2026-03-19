const router = require('express').Router();
const sc = require('../controllers/subjectController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', sc.getSubjects);
router.post('/', authMiddleware, sc.createSubject);
router.get('/:id/doubts', sc.getDoubtsBySubject);
router.get('/:id/stats', sc.getSubjectStats);

module.exports = router;