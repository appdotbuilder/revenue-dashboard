
import { db } from '../db';
import { salesTable, productsTable } from '../db/schema';
import { type RevenueQueryInput, type RevenueDataPoint } from '../schema';
import { eq, gte, lte, and, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getRevenueData(input: RevenueQueryInput): Promise<RevenueDataPoint[]> {
  try {
    // Build base query with join to get product information
    const baseQuery = db
      .select({
        product_id: salesTable.product_id,
        product_name: productsTable.name,
        total_amount: salesTable.total_amount,
        sale_date: salesTable.sale_date,
      })
      .from(salesTable)
      .innerJoin(productsTable, eq(salesTable.product_id, productsTable.id));

    // Build conditions array for filters
    const conditions: SQL<unknown>[] = [];

    if (input.product_ids && input.product_ids.length > 0) {
      // Filter by specific products using IN clause
      conditions.push(sql`${salesTable.product_id} IN (${sql.join(input.product_ids, sql`, `)})`);
    }

    if (input.start_date) {
      conditions.push(gte(salesTable.sale_date, input.start_date));
    }

    if (input.end_date) {
      conditions.push(lte(salesTable.sale_date, input.end_date));
    }

    // Execute query with or without conditions
    const results = conditions.length > 0
      ? await baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions)).execute()
      : await baseQuery.execute();

    // Group and aggregate data by granularity
    const revenueMap = new Map<string, { revenue: number; product_ids: Set<number>; product_names: Set<string> }>();

    results.forEach(result => {
      const period = formatPeriod(result.sale_date, input.granularity);
      const revenue = parseFloat(result.total_amount);

      if (!revenueMap.has(period)) {
        revenueMap.set(period, {
          revenue: 0,
          product_ids: new Set(),
          product_names: new Set()
        });
      }

      const periodData = revenueMap.get(period)!;
      periodData.revenue += revenue;
      periodData.product_ids.add(result.product_id);
      periodData.product_names.add(result.product_name);
    });

    // Convert map to array and sort by period
    const revenueData: RevenueDataPoint[] = Array.from(revenueMap.entries())
      .map(([period, data]) => ({
        period,
        revenue: data.revenue,
        // Include product info if filtering by specific products
        product_id: input.product_ids && input.product_ids.length === 1 ? input.product_ids[0] : undefined,
        product_name: data.product_names.size === 1 ? Array.from(data.product_names)[0] : undefined
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return revenueData;
  } catch (error) {
    console.error('Revenue data retrieval failed:', error);
    throw error;
  }
}

function formatPeriod(date: Date, granularity: 'yearly' | 'monthly' | 'weekly' | 'daily'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (granularity) {
    case 'yearly':
      return year.toString();
    case 'monthly':
      return `${year}-${month}`;
    case 'weekly':
      // Calculate ISO week number
      const startOfYear = new Date(year, 0, 1);
      const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      const week = Math.ceil((dayOfYear - date.getDay() + 10) / 7);
      return `${year}-W${String(week).padStart(2, '0')}`;
    case 'daily':
      return `${year}-${month}-${day}`;
    default:
      return `${year}-${month}`;
  }
}
