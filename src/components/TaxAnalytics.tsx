/**
 * Tax Analytics Component
 * Beautiful charts and graphs for tax data visualization
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { formatNaira } from '@/utils/formatters';
import type { Calculation, CalculationType } from '@/types/database';

interface TaxAnalyticsProps {
  calculations: Calculation[];
}

const TAX_COLORS: Record<CalculationType, string> = {
  pit: '#3B82F6', // blue
  cit: '#8B5CF6', // purple
  cgt: '#F97316', // orange
  vat: '#22C55E', // green
};

const TAX_LABELS: Record<CalculationType, string> = {
  pit: 'Personal Income Tax',
  cit: 'Company Income Tax',
  cgt: 'Capital Gains Tax',
  vat: 'Value Added Tax',
};

export function TaxAnalytics({ calculations }: TaxAnalyticsProps) {
  // Helper to get tax amount from calculation
  const getTaxAmount = (calc: Calculation): number => {
    const results = calc.results as Record<string, unknown>;
    switch (calc.type) {
      case 'pit': return (results.totalTax as number) || 0;
      case 'cit': return (results.totalTaxPayable as number) || 0;
      case 'cgt': return (results.cgtAmount as number) || 0;
      case 'vat': return Math.abs((results.vatAmount as number) || (results.netVAT as number) || 0);
      default: return 0;
    }
  };

  // Monthly tax data for bar chart
  const monthlyData = useMemo(() => {
    const last6Months: Date[] = [];
    for (let i = 5; i >= 0; i--) {
      last6Months.push(startOfMonth(subMonths(new Date(), i)));
    }

    return last6Months.map(monthDate => {
      const monthStr = format(monthDate, 'yyyy-MM');
      const monthCalcs = calculations.filter(c => 
        format(parseISO(c.created_at), 'yyyy-MM') === monthStr
      );

      const data: Record<string, number> = {
        pit: 0,
        cit: 0,
        cgt: 0,
        vat: 0,
      };

      monthCalcs.forEach(calc => {
        data[calc.type] += getTaxAmount(calc);
      });

      return {
        month: format(monthDate, 'MMM'),
        fullMonth: format(monthDate, 'MMMM yyyy'),
        ...data,
        total: data.pit + data.cit + data.cgt + data.vat,
      };
    });
  }, [calculations]);

  // Tax type distribution for pie chart
  const distributionData = useMemo(() => {
    const totals: Record<CalculationType, number> = {
      pit: 0,
      cit: 0,
      cgt: 0,
      vat: 0,
    };

    calculations.forEach(calc => {
      totals[calc.type] += getTaxAmount(calc);
    });

    return (Object.keys(totals) as CalculationType[])
      .filter(type => totals[type] > 0)
      .map(type => ({
        name: TAX_LABELS[type],
        value: totals[type],
        color: TAX_COLORS[type],
      }));
  }, [calculations]);

  // Tax trend data for line chart
  const trendData = useMemo(() => {
    const sortedCalcs = [...calculations].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let cumulative = 0;
    return sortedCalcs.map(calc => {
      cumulative += getTaxAmount(calc);
      return {
        date: format(parseISO(calc.created_at), 'MMM d'),
        amount: getTaxAmount(calc),
        cumulative,
        type: calc.type,
      };
    });
  }, [calculations]);

  // Summary stats
  const stats = useMemo(() => {
    const totalTax = calculations.reduce((sum, calc) => sum + getTaxAmount(calc), 0);
    const avgTax = calculations.length > 0 ? totalTax / calculations.length : 0;
    const mostCommonType = calculations.length > 0 
      ? (Object.entries(
          calculations.reduce((acc, calc) => {
            acc[calc.type] = (acc[calc.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).sort((a, b) => b[1] - a[1])[0]?.[0] as CalculationType || 'pit')
      : null;

    return {
      totalTax,
      avgTax,
      totalCalculations: calculations.length,
      mostCommonType,
    };
  }, [calculations]);

  // Custom tooltip formatter
  const currencyTooltip = (value: number | undefined) => value !== undefined ? formatNaira(value) : '';

  if (calculations.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data Yet</h3>
        <p className="text-gray-600">
          Start making calculations to see your tax analytics here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Tax Calculated</p>
              <p className="text-xl font-bold text-gray-900">{formatNaira(stats.totalTax)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average per Calculation</p>
              <p className="text-xl font-bold text-gray-900">{formatNaira(stats.avgTax)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">🧮</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Calculations</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalCalculations}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Most Used</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.mostCommonType ? TAX_LABELS[stats.mostCommonType].split(' ')[0] : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Bar Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📊</span> Monthly Tax Overview
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  formatter={currencyTooltip}
                  labelFormatter={(label) => monthlyData.find(d => d.month === label)?.fullMonth || label}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="pit" name="PIT" fill={TAX_COLORS.pit} radius={[4, 4, 0, 0]} />
                <Bar dataKey="cit" name="CIT" fill={TAX_COLORS.cit} radius={[4, 4, 0, 0]} />
                <Bar dataKey="cgt" name="CGT" fill={TAX_COLORS.cgt} radius={[4, 4, 0, 0]} />
                <Bar dataKey="vat" name="VAT" fill={TAX_COLORS.vat} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🥧</span> Tax Distribution
          </h3>
          <div className="h-72">
            {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${(name || '').toString().split(' ')[0]} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={currencyTooltip}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No data to display
              </div>
            )}
          </div>
        </div>

        {/* Line Chart - Tax Trend */}
        <div className="bg-white rounded-lg border p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📈</span> Tax Calculation Trend
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  formatter={currencyTooltip}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  name="Tax Amount"
                  stroke="#22C55E" 
                  strokeWidth={2}
                  dot={{ fill: '#22C55E', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  name="Cumulative Total"
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
