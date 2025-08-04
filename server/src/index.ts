
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { 
  createProductInputSchema, 
  createSaleInputSchema, 
  revenueQueryInputSchema 
} from './schema';
import { getProducts } from './handlers/get_products';
import { createProduct } from './handlers/create_product';
import { createSale } from './handlers/create_sale';
import { getRevenueData } from './handlers/get_revenue_data';
import { getProductRevenueBreakdown } from './handlers/get_product_revenue_breakdown';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Product management
  getProducts: publicProcedure
    .query(() => getProducts()),
  
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  
  // Sales management
  createSale: publicProcedure
    .input(createSaleInputSchema)
    .mutation(({ input }) => createSale(input)),
  
  // Revenue analytics for dashboard
  getRevenueData: publicProcedure
    .input(revenueQueryInputSchema)
    .query(({ input }) => getRevenueData(input)),
  
  getProductRevenueBreakdown: publicProcedure
    .input(revenueQueryInputSchema)
    .query(({ input }) => getProductRevenueBreakdown(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
