
import { z } from 'zod';

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  created_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Sale schema
export const saleSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  unit_price: z.number(),
  total_amount: z.number(),
  sale_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Sale = z.infer<typeof saleSchema>;

// Revenue data point schema for dashboard
export const revenueDataPointSchema = z.object({
  period: z.string(), // Format depends on granularity (e.g., "2024", "2024-01", "2024-01-15")
  revenue: z.number(),
  product_id: z.number().optional(), // Optional for aggregated data
  product_name: z.string().optional()
});

export type RevenueDataPoint = z.infer<typeof revenueDataPointSchema>;

// Time granularity enum
export const timeGranularitySchema = z.enum(['yearly', 'monthly', 'weekly', 'daily']);
export type TimeGranularity = z.infer<typeof timeGranularitySchema>;

// Revenue query input schema
export const revenueQueryInputSchema = z.object({
  product_ids: z.array(z.number()).optional(), // Filter by specific products
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  granularity: timeGranularitySchema.default('monthly')
});

export type RevenueQueryInput = z.infer<typeof revenueQueryInputSchema>;

// Input schema for creating sales
export const createSaleInputSchema = z.object({
  product_id: z.number(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  sale_date: z.coerce.date().optional() // Defaults to current date if not provided
});

export type CreateSaleInput = z.infer<typeof createSaleInputSchema>;

// Input schema for creating products
export const createProductInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.number().positive()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;
