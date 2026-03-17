const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/auth");
const { registerSchema, loginSchema } = require("../validations/authValidation");

const router = express.Router();

const loginRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many login attempts. Please try again later." }
});

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", loginRateLimiter, validate(loginSchema), authController.login);
router.get("/me", authenticate, authController.me);

module.exports = router;
