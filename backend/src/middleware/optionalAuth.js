const jwt = require("jsonwebtoken");
const env = require("../config/env");

function optionalAuthenticate(req, res, next) {
  let token = req.cookies?.ccrp_token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = {
      ...decoded,
      id: decoded.user_id || decoded.id
    };
  } catch (_error) {
    // Ignore invalid token for optional auth flows and continue as anonymous.
  }

  return next();
}

module.exports = optionalAuthenticate;
