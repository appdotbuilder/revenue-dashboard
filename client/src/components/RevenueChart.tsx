
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { RevenueDataPoint, TimeGranularity } from '../../../server/src/schema';

interface RevenueChartProps {
  data: RevenueDataPoint[];
  granularity: TimeGranularity;
  isLoading: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[300px] w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
        <div className="text-4xl mb-4">📊</div>
        <p>No revenue data available for the selected period</p>
      </div>
    );
  }

  // STUB: This is a placeholder implementation for the chart visualization
  // In a real implementation, you would use a charting library like recharts, chart.js, or d3
  // The data structure is ready and the component receives proper RevenueDataPoint[] array
  
  const maxRevenue = Math.max(...data.map((d: RevenueDataPoint) => d.revenue));
  const totalRevenue = data.reduce((sum: number, d: RevenueDataPoint) => sum + d.revenue, 0);

  return (
    <div className="space-y-4">
      {/* Simple bar chart placeholder */}
      <div className="h-[300px] flex items-end justify-between gap-1 p-4 bg-muted/30 rounded-lg border border-border">
        {data.map((point: RevenueDataPoint) => {
          const heightPercent = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
          return (
            <div key={point.period} className="flex-1 flex flex-col items-center">
              <div className="text-xs mb-1 font-medium text-foreground">
                ${point.revenue.toLocaleString()}
              </div>
              <div
                className="w-full bg-chart-1 rounded-t min-h-[4px] transition-all duration-300 hover:bg-chart-2"
                style={{ height: `${heightPercent}%` }}
                title={`${point.period}: $${point.revenue.toLocaleString()}`}
              />
              <div className="text-xs mt-2 text-muted-foreground text-center">
                {point.period}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="flex justify-between text-sm">
        <div>
          <span className="text-muted-foreground">Total Revenue: </span>
          <span className="font-semibold">${totalRevenue.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Data Points: </span>
          <span className="font-semibold">{data.length}</span>
        </div>
      </div>

      {/* Note about stub implementation */}
      <Card className="border-muted bg-muted/50 p-3">
        <div className="text-sm text-muted-foreground">
          <strong>📊 Chart Placeholder:</strong> This is a simple bar chart visualization. 
          In production, this would be replaced with a full-featured charting library 
          like Recharts or Chart.js for interactive, responsive charts.
        </div>
      </Card>
    </div>
  );
}
