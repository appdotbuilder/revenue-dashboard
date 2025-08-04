
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import type { RevenueDataPoint, TimeGranularity } from '../../../server/src/schema';

interface RevenueMetricsProps {
  revenueData: RevenueDataPoint[];
  granularity: TimeGranularity;
  isLoading: boolean;
}

export function RevenueMetrics({ revenueData, granularity, isLoading }: RevenueMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate metrics
  const totalRevenue = revenueData.reduce((sum: number, point: RevenueDataPoint) => sum + point.revenue, 0);
  const averageRevenue = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;
  const maxRevenue = revenueData.length > 0 ? Math.max(...revenueData.map((d: RevenueDataPoint) => d.revenue)) : 0;
  const periods = revenueData.length;

  // Calculate trend (comparing last period to previous)
  let trendPercent = 0;
  let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';
  
  if (revenueData.length >= 2) {
    const lastRevenue = revenueData[revenueData.length - 1]?.revenue || 0;
    const previousRevenue = revenueData[revenueData.length - 2]?.revenue || 0;
    
    if (previousRevenue > 0) {
      trendPercent = ((lastRevenue - previousRevenue) / previousRevenue) * 100;
      trendDirection = trendPercent > 0 ? 'up' : trendPercent < 0 ? 'down' : 'neutral';
    }
  }

  const formatPeriod = (granularity: TimeGranularity) => {
    switch (granularity) {
      case 'yearly': return 'years';
      case 'monthly': return 'months';
      case 'weekly': return 'weeks';
      case 'daily': return 'days';
      default: return 'periods';
    }
  };

  const metrics = [
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: `Across ${periods} ${formatPeriod(granularity)}`
    },
    {
      title: 'Average Revenue',
      value: `$${averageRevenue.toLocaleString()}`,
      icon: Calendar,
      description: `Per ${granularity.replace('ly', '')}`
    },
    {
      title: 'Peak Revenue',
      value: `$${maxRevenue.toLocaleString()}`,
      icon: TrendingUp,
      description: `Highest ${granularity.replace('ly', '')} performance`
    },
    {
      title: 'Trend',
      value: trendPercent === 0 ? 'No change' : `${Math.abs(trendPercent).toFixed(1)}%`,
      icon: trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Calendar,
      description: trendDirection === 'up' ? 'Increase' : trendDirection === 'down' ? 'Decrease' : 'Stable',
      trend: trendDirection
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon 
              className={`h-4 w-4 ${
                metric.trend === 'up' 
                  ? 'text-green-600' 
                  : metric.trend === 'down' 
                    ? 'text-red-600' 
                    : 'text-muted-foreground'
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p 
              className={`text-xs ${
                metric.trend === 'up' 
                  ? 'text-green-600' 
                  : metric.trend === 'down' 
                    ? 'text-red-600' 
                    : 'text-muted-foreground'
              }`}
            >
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
