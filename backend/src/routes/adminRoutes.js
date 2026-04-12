const express = require("express");
const authenticate = require("../middleware/auth");
const { requireAdmin } = require("../middleware/role");
const validate = require("../middleware/validate");
const adminController = require("../controllers/adminController");
const {
  assignInvestigatorAdminSchema,
  createInvestigatorSchema,
  updateInvestigatorSchema,
  investigatorIdParamSchema
} = require("../validations/adminValidation");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get("/users", adminController.getUsers);
router.get("/investigators", adminController.getInvestigators);
router.put(
  "/assign-investigator",
  validate(assignInvestigatorAdminSchema),
  adminController.assignInvestigatorByAdmin
);
router.post(
  "/investigators",
  validate(createInvestigatorSchema),
  adminController.createInvestigator
);
router.patch(
  "/investigators/:investigatorId",
  validate(investigatorIdParamSchema, "params"),
  validate(updateInvestigatorSchema),
  adminController.updateInvestigator
);
router.delete(
  "/investigators/:investigatorId",
  validate(investigatorIdParamSchema, "params"),
  adminController.deleteInvestigator
);

module.exports = router;
