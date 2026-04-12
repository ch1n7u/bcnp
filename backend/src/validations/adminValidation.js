const { z } = require("zod");

const assignInvestigatorAdminSchema = z.object({
  reportId: z.coerce.number().int().positive(),
  investigatorId: z.union([z.string().uuid(), z.coerce.number().int().positive()])
});

const createInvestigatorSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8)
});

const updateInvestigatorSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    email: z.string().trim().email().optional(),
    password: z.string().min(8).optional()
  })
  .refine((value) => value.name || value.email || value.password, {
    message: "At least one field is required"
  });

const investigatorIdParamSchema = z.object({
  investigatorId: z.union([z.string().uuid(), z.string().regex(/^\d+$/)])
});

module.exports = {
  assignInvestigatorAdminSchema,
  createInvestigatorSchema,
  updateInvestigatorSchema,
  investigatorIdParamSchema
};
