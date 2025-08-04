
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { RevenueDataPoint, TimeGranularity } from '../../../server/src/schema';

interface ProductRevenueChartProps {
  data: RevenueDataPoint[];
  granularity: TimeGranularity;
  isLoading: boolean;
}

export function ProductRevenueChart({ data, isLoading }: ProductRevenueChartProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-18" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
        <div className="text-4xl mb-4">🧩</div>
        <p>No product revenue data available for the selected period</p>
      </div>
    );
  }

  // Group data by product for better visualization
  const productGroups = data.reduce((groups: Record<string, RevenueDataPoint[]>, point: RevenueDataPoint) => {
    const productKey = point.product_name || `Product ${point.product_id}`;
    if (!groups[productKey]) {
      groups[productKey] = [];
    }
    groups[productKey].push(point);
    return groups;
  }, {});

  const productNames = Object.keys(productGroups);
  const colors = [
    'bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 
    'bg-chart-5', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'
  ];

  // Calculate totals for each product
  const productTotals = productNames.map((productName: string) => ({
    name: productName,
    total: productGroups[productName].reduce((sum: number, point: RevenueDataPoint) => sum + point.revenue, 0),
    dataPoints: productGroups[productName]
  })).sort((a, b) => b.total - a.total);

  const maxProductTotal = Math.max(...productTotals.map(p => p.total));

  return (
    <div className="space-y-6">
      {/* Product comparison bars */}
      <div className="space-y-3">
        {productTotals.map((product, index: number) => {
          const widthPercent = maxProductTotal > 0 ? (product.total / maxProductTotal) * 100 : 0;
          const colorClass = colors[index % colors.length];
          
          return (
            <div key={product.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">{product.name}</h4>
                <Badge variant="secondary">
                  ${product.total.toLocaleString()}
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-6 relative overflow-hidden">
                <div
                  className={`h-full ${colorClass} transition-all duration-500 rounded-full flex items-center justify-end pr-2`}
                  style={{ width: `${widthPercent}%` }}
                >
                  {widthPercent > 20 && (
                    <span className="text-primary-foreground text-xs font-medium">
                      {product.dataPoints.length} periods
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Time-based breakdown for top products */}
      {productTotals.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Revenue Over Time by Product</h4>
          <div className="grid gap-4">
            {productTotals.slice(0, 3).map((product, productIndex: number) => {
              const maxProductRevenue = Math.max(...product.dataPoints.map((d: RevenueDataPoint) => d.revenue));
              const colorClass = colors[productIndex % colors.length];
              
              return (
                <Card key={product.name} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                    <span className="font-medium">{product.name}</span>
                    <Badge variant="outline" className="ml-auto">
                      ${product.total.toLocaleString()} total
                    </Badge>
                  </div>
                  <div className="h-[100px] flex items-end justify-between gap-1">
                    {product.dataPoints.map((point: RevenueDataPoint) => {
                      const heightPercent = maxProductRevenue > 0 ? (point.revenue / maxProductRevenue) * 100 : 0;
                      return (
                        <div key={point.period} className="flex-1 flex flex-col items-center">
                          <div className="text-xs mb-1">
                            ${point.revenue.toLocaleString()}
                          </div>
                          <div
                            className={`w-full ${colorClass} rounded-t min-h-[2px] transition-all duration-300`}
                            style={{ height: `${heightPercent}%` }}
                            title={`${point.period}: $${point.revenue.toLocaleString()}`}
                          />
                          <div className="text-xs mt-1 text-muted-foreground">
                            {point.period}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Note about stub implementation */}
      <Card className="border-muted bg-muted/50 p-3">
        <div className="text-sm text-muted-foreground">
          <strong>🧩 Product Chart Placeholder:</strong> This shows product revenue comparison 
          and time-based breakdown. In production, this would use advanced charting with 
          stacked bars, multi-line charts, or interactive legends for better data exploration.
        </div>
      </Card>
    </div>
  );
}
