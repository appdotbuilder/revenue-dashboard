
import { db } from '../db';
import { salesTable, productsTable } from '../db/schema';
import { type CreateSaleInput, type Sale } from '../schema';
import { eq } from 'drizzle-orm';

export const createSale = async (input: CreateSaleInput): Promise<Sale> => {
  try {
    // Verify that the product exists to prevent foreign key constraint errors
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (product.length === 0) {
      throw new Error(`Product with id ${input.product_id} does not exist`);
    }

    // Calculate total amount
    const totalAmount = input.quantity * input.unit_price;
    
    // Use current date if sale_date not provided
    const saleDate = input.sale_date || new Date();

    // Insert sale record
    const result = await db.insert(salesTable)
      .values({
        product_id: input.product_id,
        quantity: input.quantity,
        unit_price: input.unit_price.toString(), // Convert number to string for numeric column
        total_amount: totalAmount.toString(), // Convert number to string for numeric column
        sale_date: saleDate
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const sale = result[0];
    return {
      ...sale,
      unit_price: parseFloat(sale.unit_price), // Convert string back to number
      total_amount: parseFloat(sale.total_amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Sale creation failed:', error);
    throw error;
  }
};
