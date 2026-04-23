const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireAdmin = require('../middleware/requireAdmin');
const adminController = require('../controllers/adminController');
const charityController = require('../controllers/charityController');

router.use(authenticate, requireAdmin);

// Users
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);

// Draws
router.get('/draws', adminController.getDraws);
router.post('/draws/simulate', adminController.simulateDraw);
router.post('/draws/publish', adminController.publishDraw);
router.get('/draws/:id', adminController.getDrawById);

// Charities (CRUD)
router.post('/charities', charityController.createCharity);
router.put('/charities/:id', charityController.updateCharity);
router.delete('/charities/:id', charityController.deleteCharity);

// Winners
router.get('/winners', adminController.getWinners);
router.put('/winners/:id/verify', adminController.verifyWinner);
router.put('/winners/:id/payout', adminController.markPayout);

// Analytics
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
