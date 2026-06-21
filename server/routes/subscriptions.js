const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const subscriptionController = require('../controllers/subscriptionController');

// Stripe webhook MUST come before authenticate (uses raw body, no JWT)
router.post('/webhook', subscriptionController.handleWebhook);

router.use(authenticate);
router.post('/create-checkout-session', subscriptionController.createCheckoutSession);
router.get('/verify-session', subscriptionController.verifySession);
router.get('/status', subscriptionController.getStatus);
router.post('/cancel', subscriptionController.cancelSubscription);
router.post('/sync', subscriptionController.syncSubscription);

module.exports = router;
