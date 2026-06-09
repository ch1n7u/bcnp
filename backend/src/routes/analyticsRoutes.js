const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const authenticate = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

router.get("/dashboard", authenticate, requireRole("admin", "investigator"), analyticsController.getDashboardAnalytics);

// Admin only routes for detailed tracking
router.get("/visitors", authenticate, requireRole("admin"), analyticsController.getVisitorAnalytics);
router.get("/pages", authenticate, requireRole("admin"), analyticsController.getPageAnalytics);
router.get("/audit-logs", authenticate, requireRole("admin"), analyticsController.getAuditLogs);

module.exports = router;
