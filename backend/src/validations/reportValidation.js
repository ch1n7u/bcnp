const { z } = require("zod");

const parseIncidentDateTime = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return parsed.toISOString();
};

const reportSchema = z.object({
  victimName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phoneNumber: z.string().trim().min(7).max(20),
  crimeType: z.enum([
    "Phishing",
    "Online fraud",
    "UPI scams",
    "Social media harassment",
    "Identity theft",
    "Cryptocurrency scams",
    "Fake websites"
  ]),
  description: z.string().trim(),
  incidentDateTime: z.preprocess(parseIncidentDateTime, z.string().datetime()),
  suspectDetails: z.string().trim().optional(),
  financialLossAmount: z.coerce.number().min(0).default(0),
  location: z.string().trim().min(2),
  status: z
    .enum(["Submitted", "Under Review", "Investigation", "Resolved", "Closed"])
    .optional()
});

const reportStatusSchema = z.object({
  status: z.enum(["Submitted", "Under Review", "Investigation", "Resolved", "Closed"])
});

const assignInvestigatorSchema = z.object({
  investigatorId: z.union([z.string().uuid(), z.coerce.number().int().positive()])
});

const caseNoteSchema = z.object({
  noteText: z.string().min(3)
});

module.exports = {
  reportSchema,
  reportStatusSchema,
  assignInvestigatorSchema,
  caseNoteSchema
};
