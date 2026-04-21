import { z } from "zod";

const transactionTypeSchema = z.enum(["income", "expense"]);
const paymentModeSchema = z.enum(["cash", "online"]);
const mobileSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{10,15}$/, "Mobile must be 10 to 15 digits");

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(100),
  password: z.string().min(6).max(100),
});

export const registerSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(6).max(100),
  confirmPassword: z.string().min(6).max(100),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  mobile: mobileSchema,
  email: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim().toLowerCase();
      return trimmed === "" ? undefined : trimmed;
    },
    z.email().optional()
  ),
  password: z.string().min(6).max(100),
  role: z.enum(["admin", "user"]).default("user"),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(30),
});

export const transactionCreateSchema = z.object({
  type: transactionTypeSchema,
  amount: z.coerce.number().positive(),
  paymentMode: paymentModeSchema.default("cash"),
  category: z.string().trim().min(2).max(40),
  description: z.string().trim().max(200).optional().default(""),
  date: z.coerce.date(),
});

export const transactionUpdateSchema = transactionCreateSchema.partial().extend({
  amount: z.coerce.number().positive().optional(),
});

export const transactionQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  type: z.enum(["income", "expense", "all"]).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});

export type TransactionInput = z.infer<typeof transactionCreateSchema>;
