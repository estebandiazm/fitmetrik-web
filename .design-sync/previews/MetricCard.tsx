import { MetricCard } from '../../src/components/coach/MetricCard';

export function TrendUp() {
  return <MetricCard label="Active Clients" value={24} icon="👥" trend={{ value: 12, direction: 'up' }} />;
}

export function TrendDown() {
  return <MetricCard label="Avg. Check-in Rate" value="68%" icon="📉" trend={{ value: 4, direction: 'down' }} />;
}

export function NoTrend() {
  return <MetricCard label="Total Plans" value={142} icon="📋" trend={null} />;
}
