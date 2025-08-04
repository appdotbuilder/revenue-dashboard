
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TimeGranularity } from '../../../server/src/schema';

interface TimeGranularitySelectorProps {
  value: TimeGranularity;
  onChange: (granularity: TimeGranularity) => void;
}

const granularityOptions = [
  { value: 'yearly' as const, label: '📅 Yearly', description: 'Annual overview' },
  { value: 'monthly' as const, label: '📊 Monthly', description: 'Month by month' },
  { value: 'weekly' as const, label: '📈 Weekly', description: 'Week by week' },
  { value: 'daily' as const, label: '📉 Daily', description: 'Day by day' }
];

export function TimeGranularitySelector({ value, onChange }: TimeGranularitySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Time Granularity</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select time granularity" />
        </SelectTrigger>
        <SelectContent>
          {granularityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex flex-col">
                <span>{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
