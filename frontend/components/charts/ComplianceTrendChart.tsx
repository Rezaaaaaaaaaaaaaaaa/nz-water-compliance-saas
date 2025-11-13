/**
 * Compliance Trend Chart
 *
 * Line chart showing compliance score trends over time (12+ months)
 */

'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export interface ComplianceTrendData {
  month: string;
  score: number;
  dwspScore?: number;
  assetScore?: number;
  documentationScore?: number;
  target?: number;
}

interface ComplianceTrendChartProps {
  data: ComplianceTrendData[];
  height?: number;
  showTarget?: boolean;
  showBreakdown?: boolean;
}

export function ComplianceTrendChart({
  data,
  height = 400,
  showTarget = true,
  showBreakdown = false
}: ComplianceTrendChartProps) {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorDwsp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Compliance Score', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
          />
          <Legend />

          {showTarget && (
            <Line
              type="monotone"
              dataKey="target"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Target"
            />
          )}

          {showBreakdown ? (
            <>
              <Area
                type="monotone"
                dataKey="dwspScore"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDwsp)"
                name="DWSP Score"
              />
              <Area
                type="monotone"
                dataKey="assetScore"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAsset)"
                name="Asset Score"
              />
            </>
          ) : (
            <Area
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorScore)"
              name="Overall Score"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Trend Indicator */}
      <div className="mt-4 flex items-center justify-center gap-4 text-sm">
        {data.length >= 2 && (
          <>
            {getTrendIndicator(data)}
            <span className="text-gray-500">
              {getTrendPercentage(data)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function getTrendIndicator(data: ComplianceTrendData[]) {
  const firstScore = data[0].score;
  const lastScore = data[data.length - 1].score;
  const diff = lastScore - firstScore;

  if (diff > 5) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="font-semibold">Improving</span>
      </div>
    );
  } else if (diff < -5) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
        <span className="font-semibold">Declining</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
        <span className="font-semibold">Stable</span>
      </div>
    );
  }
}

function getTrendPercentage(data: ComplianceTrendData[]): string {
  const firstScore = data[0].score;
  const lastScore = data[data.length - 1].score;
  const diff = lastScore - firstScore;
  const sign = diff > 0 ? '+' : '';

  return `${sign}${diff.toFixed(1)}% over ${data.length} months`;
}
