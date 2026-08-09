const express = require('express');
const rateLimit = require('express-rate-limit');
const { trackPageVisit } = require('../controllers/trackingController');
const optionalAuth = require('../middleware/optionalAuth'); // To extract user if authenticated

const router = express.Router();
const trackingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

// The visitorTracker middleware will be attached globally, 
// but we optionally extract auth token here to link the page visit to a user
router.post('/page', trackingRateLimiter, optionalAuth, trackPageVisit);

module.exports = router;
