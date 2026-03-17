const jwt = require("jsonwebtoken");
const env = require("../config/env");

function signAccessToken(user) {
  const payload = {
    user_id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn || "24h"
  });
}

module.exports = {
  signAccessToken
};
