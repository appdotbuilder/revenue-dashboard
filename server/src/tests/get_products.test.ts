
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { getProducts } from '../handlers/get_products';

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();
    
    expect(result).toEqual([]);
  });

  it('should return all products', async () => {
    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: 'Product 1',
          description: 'First product',
          price: '19.99'
        },
        {
          name: 'Product 2',
          description: 'Second product',
          price: '29.99'
        },
        {
          name: 'Product 3',
          description: null,
          price: '39.99'
        }
      ])
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(3);
    
    // Verify first product
    expect(result[0].name).toEqual('Product 1');
    expect(result[0].description).toEqual('First product');
    expect(result[0].price).toEqual(19.99);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second product
    expect(result[1].name).toEqual('Product 2');
    expect(result[1].description).toEqual('Second product');
    expect(result[1].price).toEqual(29.99);
    expect(typeof result[1].price).toBe('number');

    // Verify third product with null description
    expect(result[2].name).toEqual('Product 3');
    expect(result[2].description).toBeNull();
    expect(result[2].price).toEqual(39.99);
    expect(typeof result[2].price).toBe('number');
  });

  it('should handle numeric price conversion correctly', async () => {
    // Create product with decimal price
    await db.insert(productsTable)
      .values({
        name: 'Decimal Product',
        description: 'Product with decimal price',
        price: '123.45'
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].price).toEqual(123.45);
    expect(typeof result[0].price).toBe('number');
  });

  it('should return products with all required fields', async () => {
    await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'Test description',
        price: '50.00'
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    const product = result[0];
    
    // Verify all fields are present and correct types
    expect(typeof product.id).toBe('number');
    expect(typeof product.name).toBe('string');
    expect(typeof product.description).toBe('string');
    expect(typeof product.price).toBe('number');
    expect(product.created_at).toBeInstanceOf(Date);
  });
});
