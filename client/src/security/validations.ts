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

/**
 * Zod validation schema for Portfolio Simulations
 */
export const portfolioSimulationSchema = z.object({
  symbol: z.string()
    .min(1, "Symbol is required.")
    .transform((val) => val.toUpperCase())
    .refine(
      (val) => ["TCS", "INFY", "RELIANCE", "HDFCBANK"].includes(val),
      "Invalid symbol. Must be TCS, INFY, RELIANCE, or HDFCBANK."
    ),
  action: z.enum(["BUY", "SELL"], {
    error: () => "Action must be BUY or SELL."
  }),
  quantity: z.number({
    error: "Quantity must be a positive number."
  })
    .int("Quantity must be an integer.")
    .positive("Quantity must be greater than zero."),
  price: z.number({
    error: "Price must be a positive number."
  })
    .positive("Price must be greater than zero.")
});

/**
 * Zod validation schema for AI memory updates
 */
export const userMemorySchema = z.object({
  trading_style: z.string().min(2).max(100),
  preferred_sectors: z.array(z.string()),
  avg_holding_period: z.string().min(2).max(100),
  risk_appetite: z.string().min(2).max(50),
  best_performing_setup: z.string().max(1000).optional(),
  most_common_mistakes: z.array(z.string())
});
