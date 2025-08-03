const express = require('express');
const { getUsers, blockUsers, unblockUsers, deleteUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getUsers);
router.post('/block', protect, blockUsers);
router.post('/unblock', protect, unblockUsers);
router.post('/delete', protect, deleteUsers); // This will set status to 'deleted'

module.exports = router;