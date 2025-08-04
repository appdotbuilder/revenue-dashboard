
import { db } from '../db';
import { salesTable, productsTable } from '../db/schema';
import { type RevenueQueryInput, type RevenueDataPoint } from '../schema';
import { eq, gte, lte, and, desc, SQL, inArray } from 'drizzle-orm';

export async function getProductRevenueBreakdown(input: RevenueQueryInput): Promise<RevenueDataPoint[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input.product_ids && input.product_ids.length > 0) {
      conditions.push(inArray(salesTable.product_id, input.product_ids));
    }

    if (input.start_date) {
      conditions.push(gte(salesTable.sale_date, input.start_date));
    }

    if (input.end_date) {
      conditions.push(lte(salesTable.sale_date, input.end_date));
    }

    // Build query in a single chain to avoid TypeScript issues
    const baseQuery = db.select({
      product_id: salesTable.product_id,
      product_name: productsTable.name,
      total_amount: salesTable.total_amount,
      sale_date: salesTable.sale_date
    })
    .from(salesTable)
    .innerJoin(productsTable, eq(salesTable.product_id, productsTable.id));

    // Execute query with conditional where clause
    const results = conditions.length > 0
      ? await baseQuery
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(salesTable.sale_date))
          .execute()
      : await baseQuery
          .orderBy(desc(salesTable.sale_date))
          .execute();

    // Group and aggregate data by product and time period
    const revenueMap = new Map<string, RevenueDataPoint>();

    for (const result of results) {
      const period = formatPeriod(result.sale_date, input.granularity);
      const key = `${result.product_id}-${period}`;
      
      const revenue = parseFloat(result.total_amount);
      
      if (revenueMap.has(key)) {
        const existing = revenueMap.get(key)!;
        existing.revenue += revenue;
      } else {
        revenueMap.set(key, {
          period,
          revenue,
          product_id: result.product_id,
          product_name: result.product_name
        });
      }
    }

    // Convert map to array and sort by period and product
    const revenueData = Array.from(revenueMap.values());
    
    // Sort by period (descending) then by product_id
    revenueData.sort((a, b) => {
      const periodCompare = b.period.localeCompare(a.period);
      if (periodCompare !== 0) return periodCompare;
      return (a.product_id || 0) - (b.product_id || 0);
    });

    return revenueData;
  } catch (error) {
    console.error('Product revenue breakdown query failed:', error);
    throw error;
  }
}

function formatPeriod(date: Date, granularity: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (granularity) {
    case 'yearly':
      return year.toString();
    case 'monthly':
      return `${year}-${month}`;
    case 'weekly':
      // Get the start of the week (Sunday)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekYear = weekStart.getFullYear();
      const weekMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
      const weekDay = String(weekStart.getDate()).padStart(2, '0');
      return `${weekYear}-${weekMonth}-${weekDay}`;
    case 'daily':
      return `${year}-${month}-${day}`;
    default:
      return `${year}-${month}`;
  }
}
