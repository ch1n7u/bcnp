const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/auth");
const { registerSchema, sendOtpSchema, loginSchema } = require("../validations/authValidation");

const router = express.Router();

const loginRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		res.status(429).json({
			status: "error",
			message: "Unable to process your request.",
			correlationId: req.correlationId
		});
	}
});
const registerRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		res.status(429).json({
			status: "error",
			message: "Unable to process your request.",
			correlationId: req.correlationId
		});
	}
});


router.post("/send-otp", registerRateLimiter, validate(sendOtpSchema), authController.sendOtp);
router.post("/verify-otp", registerRateLimiter, authController.verifyOtp);
router.post("/register-final", registerRateLimiter, validate(registerSchema), authController.registerFinal);
router.post("/forgot-password/send-otp", loginRateLimiter, authController.forgotPasswordSendOtp);
router.post("/forgot-password/verify-otp", loginRateLimiter, authController.forgotPasswordVerifyOtp);
router.post("/forgot-password/reset", loginRateLimiter, authController.resetPassword);
router.post("/login", loginRateLimiter, validate(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);
router.post("/google", authController.googleLogin);

module.exports = router;
