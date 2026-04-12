function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}

const requireCitizen = requireRole("citizen");
const requireInvestigator = requireRole("investigator");
const requireAdmin = requireRole("admin");

module.exports = {
  requireRole,
  requireCitizen,
  requireInvestigator,
  requireAdmin
};
