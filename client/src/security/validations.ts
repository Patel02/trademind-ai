import { z } from "zod";

/**
 * Zod validation schema for Simulated Trade orders.
 */
export const tradeOrderSchema = z.object({
  symbol: z.string()
    .min(1, "Asset symbol is required.")
    .transform((val) => val.toUpperCase())
    .refine(
      (val) => ["TCS", "INFY", "RELIANCE", "HDFCBANK"].includes(val),
      "Invalid symbol. Symbol must be an active asset (TCS, INFY, RELIANCE, HDFCBANK)."
    ),
  type: z.enum(["BUY", "SELL"], {
    error: () => "Trade type must be either 'BUY' or 'SELL'."
  }),
  quantity: z.number({
    error: "Order quantity must be a positive integer number."
  })
    .int("Order quantity must be an integer share count.")
    .positive("Order quantity must be greater than zero.")
});

/**
 * Zod validation schema for User Profile metadata.
 */
export const profileUpdateSchema = z.object({
  full_name: z.string()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name cannot exceed 100 characters.")
    .trim(),
  email: z.string()
    .email("Please enter a valid email address.")
    .toLowerCase()
});
