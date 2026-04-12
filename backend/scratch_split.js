const fs = require('fs');

let controllerCode = fs.readFileSync('./src/controllers/authController.js', 'utf8');

// We have verifyOtpAndRegister function:
const verifyOtpAndRegisterRegex = /async function verifyOtpAndRegister\(req, res, next\) \{[\s\S]*?\} catch \(error\) \{\s*return next\(error\);\s*\}\s*\}/;

const replacementCode = `async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    const storeItem = otpStore.store.get(email);
    if (!storeItem || storeItem.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP has expired or not requested." });
    }

    if (storeItem.otpCode !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Mark as verified!
    storeItem.verified = true;

    return res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now complete registration.",
    });

  } catch (error) {
    return next(error);
  }
}

async function registerFinal(req, res, next) {
  try {
    const { email } = req.body;

    const storeItem = otpStore.store.get(email);
    if (!storeItem || storeItem.expiresAt < Date.now() || !storeItem.verified) {
      return res.status(400).json({ message: "Please verify your email with OTP first." });
    }

    const registrationData = storeItem.value; // { name, email, passwordHash }

    // Double check email hasn't been registered in the meantime
    const existing = await findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await createUser({
      name: registrationData.name,
      email: registrationData.email,
      passwordHash: registrationData.passwordHash,
      role: "citizen"
    });

    otpStore.delete(email);

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Please login to continue.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    return next(error);
  }
}`;

controllerCode = controllerCode.replace(verifyOtpAndRegisterRegex, replacementCode);
controllerCode = controllerCode.replace(/verifyOtpAndRegister,/g, 'verifyOtp,\n  registerFinal,');

fs.writeFileSync('./src/controllers/authController.js', controllerCode);

// Update authRoutes.js
let routesCode = fs.readFileSync('./src/routes/authRoutes.js', 'utf8');
routesCode = routesCode.replace(/router\.post\("\/verify-otp-register",.*?\);\n/, 'router.post("/verify-otp", registerRateLimiter, authController.verifyOtp);\nrouter.post("/register-final", registerRateLimiter, authController.registerFinal);\n');
fs.writeFileSync('./src/routes/authRoutes.js', routesCode);

console.log('Routes and Controllers updated!');
