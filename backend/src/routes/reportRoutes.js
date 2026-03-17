const express = require("express");
const reportController = require("../controllers/reportController");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/auth");
const optionalAuthenticate = require("../middleware/optionalAuth");
const { requireRole } = require("../middleware/role");
const { reportSchema } = require("../validations/reportValidation");

const router = express.Router();

router.get("/options", reportController.getReportOptions);
router.post("/", optionalAuthenticate, validate(reportSchema), reportController.createReport);

router.use(authenticate);

router.get("/my", requireRole("citizen", "investigator"), reportController.getMyReports);
router.get("/me", requireRole("citizen", "investigator"), reportController.getMyReports);
router.get("/", requireRole("investigator", "admin"), reportController.getReports);
router.get("/:reportId", requireRole("investigator", "citizen", "admin"), reportController.getReportById);

module.exports = router;
