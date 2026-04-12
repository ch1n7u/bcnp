const express = require("express");
const evidenceController = require("../controllers/evidenceController");
const authenticate = require("../middleware/auth");
const optionalAuthenticate = require("../middleware/optionalAuth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

router.post(
  "/:reportId",
  optionalAuthenticate,
  evidenceController.upload.single("evidence"),
  evidenceController.uploadEvidence
);

router.use(authenticate);

router.get(
  "/:reportId",
  requireRole("citizen", "investigator"),
  evidenceController.getEvidenceByReport
);

module.exports = router;
