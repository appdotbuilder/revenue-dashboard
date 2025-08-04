
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, salesTable } from '../db/schema';
import { type RevenueQueryInput } from '../schema';
import { getRevenueData } from '../handlers/get_revenue_data';

describe('getRevenueData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no sales exist', async () => {
    const input: RevenueQueryInput = {
      granularity: 'monthly'
    };

    const result = await getRevenueData(input);
    expect(result).toEqual([]);
  });

  it('should aggregate revenue by monthly granularity', async () => {
    // Create test product
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'Test Description',
        price: '29.99'
      })
      .returning()
      .execute();

    // Create sales in different months
    await db.insert(salesTable)
      .values([
        {
          product_id: product.id,
          quantity: 2,
          unit_price: '29.99',
          total_amount: '59.98',
          sale_date: new Date('2024-01-15')
        },
        {
          product_id: product.id,
          quantity: 1,
          unit_price: '29.99',
          total_amount: '29.99',
          sale_date: new Date('2024-01-20')
        },
        {
          product_id: product.id,
          quantity: 3,
          unit_price: '29.99',
          total_amount: '89.97',
          sale_date: new Date('2024-02-10')
        }
      ])
      .execute();

    const input: RevenueQueryInput = {
      granularity: 'monthly'
    };

    const result = await getRevenueData(input);

    expect(result).toHaveLength(2);
    expect(result[0].period).toBe('2024-01');
    expect(result[0].revenue).toBeCloseTo(89.97, 2); // 59.98 + 29.99
    expect(result[1].period).toBe('2024-02');
    expect(result[1].revenue).toBeCloseTo(89.97, 2);
  });

  it('should filter by product_ids', async () => {
    // Create test products
    const [product1] = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        description: 'Test Product 1',
        price: '19.99'
      })
      .returning()
      .execute();

    const [product2] = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        description: 'Test Product 2',
        price: '39.99'
      })
      .returning()
      .execute();

    // Create sales for both products
    await db.insert(salesTable)
      .values([
        {
          product_id: product1.id,
          quantity: 1,
          unit_price: '19.99',
          total_amount: '19.99',
          sale_date: new Date('2024-01-15')
        },
        {
          product_id: product2.id,
          quantity: 1,
          unit_price: '39.99',
          total_amount: '39.99',
          sale_date: new Date('2024-01-15')
        }
      ])
      .execute();

    const input: RevenueQueryInput = {
      product_ids: [product1.id],
      granularity: 'monthly'
    };

    const result = await getRevenueData(input);

    expect(result).toHaveLength(1);
    expect(result[0].revenue).toBeCloseTo(19.99, 2);
    expect(result[0].product_id).toBe(product1.id);
    expect(result[0].product_name).toBe('Product 1');
  });

  it('should filter by date range', async () => {
    // Create test product
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'Test Description',
        price: '25.00'
      })
      .returning()
      .execute();

    // Create sales across different dates
    await db.insert(salesTable)
      .values([
        {
          product_id: product.id,
          quantity: 1,
          unit_price: '25.00',
          total_amount: '25.00',
          sale_date: new Date('2024-01-10') // Before range
        },
        {
          product_id: product.id,
          quantity: 1,
          unit_price: '25.00',
          total_amount: '25.00',
          sale_date: new Date('2024-01-20') // In range
        },
        {
          product_id: product.id,
          quantity: 1,
          unit_price: '25.00',
          total_amount: '25.00',
          sale_date: new Date('2024-02-10') // After range
        }
      ])
      .execute();

    const input: RevenueQueryInput = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-25'),
      granularity: 'daily'
    };

    const result = await getRevenueData(input);

    expect(result).toHaveLength(1);
    expect(result[0].period).toBe('2024-01-20');
    expect(result[0].revenue).toBeCloseTo(25.00, 2);
  });

  it('should handle yearly granularity', async () => {
    // Create test product
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'Test Description',
        price: '100.00'
      })
      .returning()
      .execute();

    // Create sales in different years
    await db.insert(salesTable)
      .values([
        {
          product_id: product.id,
          quantity: 1,
          unit_price: '100.00',
          total_amount: '100.00',
          sale_date: new Date('2023-06-15')
        },
        {
          product_id: product.id,
          quantity: 2,
          unit_price: '100.00',
          total_amount: '200.00',
          sale_date: new Date('2024-03-10')
        }
      ])
      .execute();

    const input: RevenueQueryInput = {
      granularity: 'yearly'
    };

    const result = await getRevenueData(input);

    expect(result).toHaveLength(2);
    expect(result[0].period).toBe('2023');
    expect(result[0].revenue).toBeCloseTo(100.00, 2);
    expect(result[1].period).toBe('2024');
    expect(result[1].revenue).toBeCloseTo(200.00, 2);
  });

  it('should handle daily granularity', async () => {
    // Create test product
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'Test Description',
        price: '50.00'
      })
      .returning()
      .execute();

    // Create sales on same day
    await db.insert(salesTable)
      .values([
        {
          product_id: product.id,
          quantity: 1,
          unit_price: '50.00',
          total_amount: '50.00',
          sale_date: new Date('2024-01-15T10:00:00')
        },
        {
          product_id: product.id,
          quantity: 1,
          unit_price: '50.00',
          total_amount: '50.00',
          sale_date: new Date('2024-01-15T15:00:00')
        }
      ])
      .execute();

    const input: RevenueQueryInput = {
      granularity: 'daily'
    };

    const result = await getRevenueData(input);

    expect(result).toHaveLength(1);
    expect(result[0].period).toBe('2024-01-15');
    expect(result[0].revenue).toBeCloseTo(100.00, 2);
  });

  it('should return results sorted by period', async () => {
    // Create test product
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'Test Description',
        price: '10.00'
      })
      .returning()
      .execute();

    // Create sales in reverse chronological order
    await db.insert(salesTable)
      .values([
        {
          product_id: product.id,
          quantity: 1,
          unit_price: '10.00',
          total_amount: '10.00',
          sale_date: new Date('2024-03-15')
        },
        {
          product_id: product.id,
          quantity: 1,
          unit_price: '10.00',
          total_amount: '10.00',
          sale_date: new Date('2024-01-15')
        },
        {
          product_id: product.id,
          quantity: 1,
          unit_price: '10.00',
          total_amount: '10.00',
          sale_date: new Date('2024-02-15')
        }
      ])
      .execute();

    const input: RevenueQueryInput = {
      granularity: 'monthly'
    };

    const result = await getRevenueData(input);

    expect(result).toHaveLength(3);
    expect(result[0].period).toBe('2024-01');
    expect(result[1].period).toBe('2024-02');
    expect(result[2].period).toBe('2024-03');
  });
});
