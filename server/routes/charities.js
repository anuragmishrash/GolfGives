const express = require('express');
const router = express.Router();
const charityController = require('../controllers/charityController');

// Public routes
router.get('/', charityController.getCharities);
router.get('/:slug', charityController.getCharityBySlug);

module.exports = router;
