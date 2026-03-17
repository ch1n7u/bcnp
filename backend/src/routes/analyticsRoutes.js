const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const authenticate = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

router.get("/dashboard", authenticate, requireRole("admin", "investigator"), analyticsController.getDashboardAnalytics);

module.exports = router;
