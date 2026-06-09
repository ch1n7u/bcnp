const express = require('express');
const { trackPageVisit } = require('../controllers/trackingController');
const optionalAuth = require('../middleware/optionalAuth'); // To extract user if authenticated

const router = express.Router();

// The visitorTracker middleware will be attached globally, 
// but we optionally extract auth token here to link the page visit to a user
router.post('/page', optionalAuth, trackPageVisit);

module.exports = router;
