const {
  requireRole,
  requireCitizen,
  requireInvestigator,
  requireAdmin
} = require("./role");

function authorize(...roles) {
  return requireRole(...roles);
}

module.exports = {
  authorize,
  requireRole,
  requireCitizen,
  requireInvestigator,
  requireAdmin
};
