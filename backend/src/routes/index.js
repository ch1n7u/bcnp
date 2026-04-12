const express = require("express");
const authRoutes = require("./authRoutes");
const reportRoutes = require("./reportRoutes");
const caseRoutes = require("./caseRoutes");
const evidenceRoutes = require("./evidenceRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/reports", reportRoutes);
router.use("/cases", caseRoutes);
router.use("/evidence", evidenceRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
