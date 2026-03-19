const express = require("express");
const caseController = require("../controllers/caseController");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/auth");
const { requireRole, requireAdmin } = require("../middleware/role");
const {
  reportStatusSchema,
  assignInvestigatorSchema,
  caseNoteSchema
} = require("../validations/reportValidation");

const router = express.Router();

router.use(authenticate);

router.get("/assigned", requireRole("investigator"), caseController.getAssignedCases);

router.patch(
  "/:reportId/status",
  requireRole("admin", "investigator"),
  validate(reportStatusSchema),
  caseController.updateStatus
);

router.patch(
  "/:reportId/assign",
  requireAdmin,
  validate(assignInvestigatorSchema),
  caseController.assignInvestigator
);

router.post(
  "/:reportId/notes",
  requireRole("admin", "investigator"),
  validate(caseNoteSchema),
  caseController.addCaseNote
);

router.get("/:reportId/notes", requireRole("admin", "investigator"), caseController.getCaseNotes);
router.get("/:reportId/timeline", requireRole("admin", "investigator"), caseController.getCaseTimeline);
router.delete("/:reportId", requireAdmin, caseController.deleteCase);

module.exports = router;
