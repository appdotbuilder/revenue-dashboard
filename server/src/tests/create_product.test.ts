
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  price: 19.99
};

const testInputWithoutDescription: CreateProductInput = {
  name: 'Product Without Description',
  price: 29.99
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product with description', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.description).toEqual('A product for testing');
    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toEqual('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a product without description', async () => {
    const result = await createProduct(testInputWithoutDescription);

    // Basic field validation
    expect(result.name).toEqual('Product Without Description');
    expect(result.description).toBeNull();
    expect(result.price).toEqual(29.99);
    expect(typeof result.price).toEqual('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save product to database', async () => {
    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Test Product');
    expect(products[0].description).toEqual('A product for testing');
    expect(parseFloat(products[0].price)).toEqual(19.99);
    expect(products[0].created_at).toBeInstanceOf(Date);
  });

  it('should save product without description to database', async () => {
    const result = await createProduct(testInputWithoutDescription);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Product Without Description');
    expect(products[0].description).toBeNull();
    expect(parseFloat(products[0].price)).toEqual(29.99);
    expect(products[0].created_at).toBeInstanceOf(Date);
  });
});
