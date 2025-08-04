
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, salesTable } from '../db/schema';
import { type RevenueQueryInput } from '../schema';
import { getProductRevenueBreakdown } from '../handlers/get_product_revenue_breakdown';

describe('getProductRevenueBreakdown', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test products
  const createTestProduct = async (name: string, price: number) => {
    const result = await db.insert(productsTable)
      .values({
        name,
        description: `Description for ${name}`,
        price: price.toString()
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create test sales
  const createTestSale = async (productId: number, quantity: number, unitPrice: number, saleDate: Date) => {
    const totalAmount = quantity * unitPrice;
    const result = await db.insert(salesTable)
      .values({
        product_id: productId,
        quantity,
        unit_price: unitPrice.toString(),
        total_amount: totalAmount.toString(),
        sale_date: saleDate
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should return revenue breakdown by product and month', async () => {
    // Create test products
    const product1 = await createTestProduct('Product A', 10.00);
    const product2 = await createTestProduct('Product B', 20.00);

    // Create test sales for January 2024
    const jan2024 = new Date('2024-01-15');
    await createTestSale(product1.id, 2, 10.00, jan2024);
    await createTestSale(product1.id, 1, 10.00, jan2024);
    await createTestSale(product2.id, 3, 20.00, jan2024);

    // Create test sales for February 2024
    const feb2024 = new Date('2024-02-15');
    await createTestSale(product1.id, 1, 10.00, feb2024);
    await createTestSale(product2.id, 2, 20.00, feb2024);

    const input: RevenueQueryInput = {
      granularity: 'monthly'
    };

    const result = await getProductRevenueBreakdown(input);

    // Verify we have data for both products and both months
    expect(result).toHaveLength(4);

    // Find specific data points
    const product1Jan = result.find(r => r.product_id === product1.id && r.period === '2024-01');
    const product1Feb = result.find(r => r.product_id === product1.id && r.period === '2024-02');
    const product2Jan = result.find(r => r.product_id === product2.id && r.period === '2024-01');
    const product2Feb = result.find(r => r.product_id === product2.id && r.period === '2024-02');

    expect(product1Jan).toBeDefined();
    expect(product1Jan!.revenue).toEqual(30.00); // 2*10 + 1*10
    expect(product1Jan!.product_name).toEqual('Product A');

    expect(product1Feb).toBeDefined();
    expect(product1Feb!.revenue).toEqual(10.00);

    expect(product2Jan).toBeDefined();
    expect(product2Jan!.revenue).toEqual(60.00); // 3*20

    expect(product2Feb).toBeDefined();
    expect(product2Feb!.revenue).toEqual(40.00); // 2*20
  });

  it('should filter by specific product IDs', async () => {
    // Create test products
    const product1 = await createTestProduct('Product A', 10.00);
    const product2 = await createTestProduct('Product B', 20.00);
    const product3 = await createTestProduct('Product C', 30.00);

    // Create sales for all products
    const testDate = new Date('2024-01-15');
    await createTestSale(product1.id, 1, 10.00, testDate);
    await createTestSale(product2.id, 1, 20.00, testDate);
    await createTestSale(product3.id, 1, 30.00, testDate);

    const input: RevenueQueryInput = {
      product_ids: [product1.id, product3.id],
      granularity: 'monthly'
    };

    const result = await getProductRevenueBreakdown(input);

    // Should only return data for product1 and product3
    expect(result).toHaveLength(2);
    
    const productIds = result.map(r => r.product_id);
    expect(productIds).toContain(product1.id);
    expect(productIds).toContain(product3.id);
    expect(productIds).not.toContain(product2.id);
  });

  it('should filter by date range', async () => {
    // Create test product
    const product = await createTestProduct('Test Product', 15.00);

    // Create sales in different months
    await createTestSale(product.id, 1, 15.00, new Date('2024-01-15'));
    await createTestSale(product.id, 1, 15.00, new Date('2024-02-15'));
    await createTestSale(product.id, 1, 15.00, new Date('2024-03-15'));

    const input: RevenueQueryInput = {
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28'),
      granularity: 'monthly'
    };

    const result = await getProductRevenueBreakdown(input);

    // Should only return February data
    expect(result).toHaveLength(1);
    expect(result[0].period).toEqual('2024-02');
    expect(result[0].revenue).toEqual(15.00);
  });

  it('should handle different time granularities', async () => {
    // Create test product
    const product = await createTestProduct('Test Product', 25.00);

    // Create sales on specific dates
    const date1 = new Date('2024-01-15');
    const date2 = new Date('2024-01-16');
    await createTestSale(product.id, 1, 25.00, date1);
    await createTestSale(product.id, 1, 25.00, date2);

    // Test yearly granularity
    const yearlyInput: RevenueQueryInput = {
      granularity: 'yearly'
    };
    const yearlyResult = await getProductRevenueBreakdown(yearlyInput);
    expect(yearlyResult).toHaveLength(1);
    expect(yearlyResult[0].period).toEqual('2024');
    expect(yearlyResult[0].revenue).toEqual(50.00);

    // Test daily granularity
    const dailyInput: RevenueQueryInput = {
      granularity: 'daily'
    };
    const dailyResult = await getProductRevenueBreakdown(dailyInput);
    expect(dailyResult).toHaveLength(2);
    
    const day1Data = dailyResult.find(r => r.period === '2024-01-15');
    const day2Data = dailyResult.find(r => r.period === '2024-01-16');
    expect(day1Data).toBeDefined();
    expect(day1Data!.revenue).toEqual(25.00);
    expect(day2Data).toBeDefined();
    expect(day2Data!.revenue).toEqual(25.00);
  });

  it('should return empty array when no sales exist', async () => {
    const input: RevenueQueryInput = {
      granularity: 'monthly'
    };

    const result = await getProductRevenueBreakdown(input);
    expect(result).toHaveLength(0);
  });

  it('should aggregate multiple sales for same product and period correctly', async () => {
    // Create test product
    const product = await createTestProduct('Test Product', 12.50);

    // Create multiple sales on same day
    const testDate = new Date('2024-01-15');
    await createTestSale(product.id, 2, 12.50, testDate);
    await createTestSale(product.id, 3, 12.50, testDate);
    await createTestSale(product.id, 1, 12.50, testDate);

    const input: RevenueQueryInput = {
      granularity: 'daily'
    };

    const result = await getProductRevenueBreakdown(input);

    // Should aggregate all sales into one data point
    expect(result).toHaveLength(1);
    expect(result[0].period).toEqual('2024-01-15');
    expect(result[0].revenue).toEqual(75.00); // (2+3+1) * 12.50
    expect(result[0].product_id).toEqual(product.id);
    expect(result[0].product_name).toEqual('Test Product');
  });
});
