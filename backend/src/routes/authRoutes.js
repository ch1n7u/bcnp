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
	message: { message: "Too many login attempts. Please try again later." }
});
const registerRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many registration attempts. Please try again later." }
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
