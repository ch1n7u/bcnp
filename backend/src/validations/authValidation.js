const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  phone: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    z.string().regex(/^\+?[0-9]{10,15}$/, "Phone must be 10 to 15 digits").optional()
  )
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8)
});

module.exports = {
  registerSchema,
  loginSchema
};
