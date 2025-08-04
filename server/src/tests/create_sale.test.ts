
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salesTable, productsTable } from '../db/schema';
import { type CreateSaleInput } from '../schema';
import { createSale } from '../handlers/create_sale';
import { eq } from 'drizzle-orm';

describe('createSale', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testProductId: number;

  beforeEach(async () => {
    // Create test product first (prerequisite for sales)
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing sales',
        price: '19.99'
      })
      .returning()
      .execute();
    
    testProductId = productResult[0].id;
  });

  const testInput: CreateSaleInput = {
    product_id: 0, // Will be set to testProductId in each test
    quantity: 5,
    unit_price: 15.50,
    sale_date: new Date('2024-01-15T10:30:00Z')
  };

  it('should create a sale with all fields', async () => {
    const input = { ...testInput, product_id: testProductId };
    const result = await createSale(input);

    // Basic field validation
    expect(result.product_id).toEqual(testProductId);
    expect(result.quantity).toEqual(5);
    expect(result.unit_price).toEqual(15.50);
    expect(typeof result.unit_price).toBe('number');
    expect(result.total_amount).toEqual(77.50); // 5 * 15.50
    expect(typeof result.total_amount).toBe('number');
    expect(result.sale_date).toEqual(new Date('2024-01-15T10:30:00Z'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save sale to database', async () => {
    const input = { ...testInput, product_id: testProductId };
    const result = await createSale(input);

    // Query using proper drizzle syntax
    const sales = await db.select()
      .from(salesTable)
      .where(eq(salesTable.id, result.id))
      .execute();

    expect(sales).toHaveLength(1);
    expect(sales[0].product_id).toEqual(testProductId);
    expect(sales[0].quantity).toEqual(5);
    expect(parseFloat(sales[0].unit_price)).toEqual(15.50);
    expect(parseFloat(sales[0].total_amount)).toEqual(77.50);
    expect(sales[0].created_at).toBeInstanceOf(Date);
  });

  it('should use current date when sale_date is not provided', async () => {
    const inputWithoutDate = {
      product_id: testProductId,
      quantity: 3,
      unit_price: 10.00
    };

    const beforeCreate = new Date();
    const result = await createSale(inputWithoutDate);
    const afterCreate = new Date();

    expect(result.sale_date).toBeInstanceOf(Date);
    expect(result.sale_date >= beforeCreate).toBe(true);
    expect(result.sale_date <= afterCreate).toBe(true);
  });

  it('should calculate total_amount correctly', async () => {
    const input = { 
      ...testInput, 
      product_id: testProductId,
      quantity: 10,
      unit_price: 7.25
    };
    
    const result = await createSale(input);

    expect(result.total_amount).toEqual(72.50); // 10 * 7.25
    expect(typeof result.total_amount).toBe('number');
  });

  it('should throw error when product does not exist', async () => {
    const input = { 
      ...testInput, 
      product_id: 99999 // Non-existent product ID
    };

    await expect(createSale(input)).rejects.toThrow(/product with id 99999 does not exist/i);
  });
});
