// types/index.ts
export interface FilterState {
  startDate: string;
  endDate: string;
  plateNumber: string;
  saleType: 'all' | 'retail' | 'wholesale' | 'reproduction';
}

export interface StatsCardProps {
  title: string;
  amount: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend: string;
}