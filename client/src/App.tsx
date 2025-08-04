
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { ProductFilter } from '@/components/ProductFilter';
import { TimeGranularitySelector } from '@/components/TimeGranularitySelector';
import { DateRangePicker } from '@/components/DateRangePicker';
import { RevenueChart } from '@/components/RevenueChart';
import { ProductRevenueChart } from '@/components/ProductRevenueChart';
import { RevenueMetrics } from '@/components/RevenueMetrics';
import type { Product, RevenueDataPoint, TimeGranularity } from '../../server/src/schema';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [granularity, setGranularity] = useState<TimeGranularity>('monthly');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [productRevenueData, setProductRevenueData] = useState<RevenueDataPoint[]>([]);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);

  // Load products on component mount
  const loadProducts = useCallback(async () => {
    try {
      const result = await trpc.getProducts.query();
      setProducts(result);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Load revenue data when filters change
  const loadRevenueData = useCallback(async () => {
    setIsLoadingRevenue(true);
    try {
      const queryInput = {
        product_ids: selectedProductIds.length > 0 ? selectedProductIds : undefined,
        start_date: startDate,
        end_date: endDate,
        granularity
      };

      const [totalRevenue, productBreakdown] = await Promise.all([
        trpc.getRevenueData.query(queryInput),
        trpc.getProductRevenueBreakdown.query(queryInput)
      ]);

      setRevenueData(totalRevenue);
      setProductRevenueData(productBreakdown);
    } catch (error) {
      console.error('Failed to load revenue data:', error);
      // Set empty arrays as fallback for stub data
      setRevenueData([]);
      setProductRevenueData([]);
    } finally {
      setIsLoadingRevenue(false);
    }
  }, [selectedProductIds, granularity, startDate, endDate]);

  useEffect(() => {
    loadRevenueData();
  }, [loadRevenueData]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Revenue Dashboard</h1>
          <p className="text-muted-foreground">
            Track and analyze product revenue over time
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Filters</CardTitle>
          <CardDescription>
            Customize your revenue analysis by selecting products, time range, and granularity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ProductFilter
              products={products}
              selectedProductIds={selectedProductIds}
              onSelectionChange={setSelectedProductIds}
            />
            <TimeGranularitySelector
              value={granularity}
              onChange={setGranularity}
            />
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Overview */}
      <RevenueMetrics 
        revenueData={revenueData} 
        granularity={granularity}
        isLoading={isLoadingRevenue}
      />

      {/* Charts Section */}
      <Tabs defaultValue="total" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="total">📈 Total Revenue</TabsTrigger>
          <TabsTrigger value="breakdown">🧩 Product Breakdown</TabsTrigger>
        </TabsList>
        
        <TabsContent value="total" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue Over Time</CardTitle>
              <CardDescription>
                {selectedProductIds.length > 0
                  ? `Revenue for ${selectedProductIds.length} selected product${selectedProductIds.length > 1 ? 's' : ''}`
                  : 'Revenue for all products'
                } - {granularity} view
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart 
                data={revenueData} 
                granularity={granularity}
                isLoading={isLoadingRevenue}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Product</CardTitle>
              <CardDescription>
                Compare revenue performance across different products - {granularity} view
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductRevenueChart 
                data={productRevenueData} 
                granularity={granularity}
                isLoading={isLoadingRevenue}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Status */}
      {revenueData.length === 0 && !isLoadingRevenue && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">No Revenue Data Available</h3>
            <p className="text-muted-foreground text-center max-w-md">
              No sales data found for the selected filters. Try adjusting your date range or product selection, 
              or create some sales to see revenue analytics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default App;
