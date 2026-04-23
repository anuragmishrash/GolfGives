const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireActiveSubscription = require('../middleware/requireActiveSubscription');
const userController = require('../controllers/userController');

// Requires both authentication and active subscription
router.post('/:id/upload-proof', authenticate, requireActiveSubscription, userController.uploadProof);

module.exports = router;
