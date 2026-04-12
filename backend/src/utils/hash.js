const crypto = require("crypto");

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

module.exports = {
  sha256Buffer
};
