const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, "Phone must be 10 to 15 digits")
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8)
});

module.exports = {
  registerSchema,
  loginSchema
};
