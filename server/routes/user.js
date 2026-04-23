const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireActiveSubscription = require('../middleware/requireActiveSubscription');
const userController = require('../controllers/userController');

router.use(authenticate); // All user routes require auth

router.get('/me', userController.getMe);
router.put('/profile', userController.updateProfile);
router.put('/charity', userController.updateCharity);

// Score routes — require active subscription for POST/PUT/DELETE
router.get('/scores', requireActiveSubscription, userController.getScores);
router.post('/scores', requireActiveSubscription, userController.addScore);
router.put('/scores/:id', requireActiveSubscription, userController.updateScore);
router.delete('/scores/:id', requireActiveSubscription, userController.deleteScore);

router.get('/draws', userController.getUserDraws);
router.get('/winnings', userController.getWinnings);

module.exports = router;
