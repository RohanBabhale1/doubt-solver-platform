const router = require('express').Router();
const sc = require('../controllers/searchController');

router.get('/', sc.searchDoubts);
router.get('/subjects', sc.searchSubjects);
router.get('/users', sc.searchUsers);

module.exports = router;