const jwt = require("jsonwebtoken");
const env = require("../config/env");

function authenticate(req, res, next) {
  let token = req.cookies?.ccrp_token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = {
      ...decoded,
      id: decoded.user_id || decoded.id
    };

    if (!req.user.id || !req.user.role) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = authenticate;
