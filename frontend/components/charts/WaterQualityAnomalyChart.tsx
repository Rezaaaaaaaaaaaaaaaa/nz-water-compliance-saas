/**
 * Water Quality Anomaly Detection Chart
 *
 * Shows water quality test results with anomaly spike detection
 */

'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Scatter, ScatterChart, ZAxis } from 'recharts';

export interface WaterQualityData {
  date: string;
  value: number;
  parameter: string;
  isAnomaly?: boolean;
  threshold?: number;
  isCompliant: boolean;
}

interface WaterQualityAnomalyChartProps {
  data: WaterQualityData[];
  parameter: string;
  threshold?: number;
  height?: number;
}

export function WaterQualityAnomalyChart({
  data,
  parameter,
  threshold,
  height = 400
}: WaterQualityAnomalyChartProps) {
  // Separate normal and anomaly points
  const normalData = data.filter(d => !d.isAnomaly);
  const anomalyData = data.filter(d => d.isAnomaly);

  // Calculate statistics
  const avg = data.reduce((sum, d) => sum + d.value, 0) / data.length;
  const max = Math.max(...data.map(d => d.value));
  const anomalyCount = anomalyData.length;

  return (
    <div className="w-full">
      {/* Stats Header */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Average</p>
          <p className="text-2xl font-bold text-blue-600">{avg.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Peak Value</p>
          <p className="text-2xl font-bold text-red-600">{max.toFixed(2)}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Anomalies</p>
          <p className="text-2xl font-bold text-amber-600">{anomalyCount}</p>
        </div>
        <div className={`p-4 rounded-lg ${anomalyCount === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-sm text-gray-600">Status</p>
          <p className={`text-2xl font-bold ${anomalyCount === 0 ? 'text-green-600' : 'text-red-600'}`}>
            {anomalyCount === 0 ? 'Normal' : 'Alert'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={80}
            style={{ fontSize: '11px' }}
          />
          <YAxis
            label={{ value: parameter, angle: -90, position: 'insideLeft' }}
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip parameter={parameter} />} />
          <Legend />

          {/* Threshold line */}
          {threshold && (
            <ReferenceLine
              y={threshold}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: 'Threshold', position: 'right', fill: '#ef4444' }}
            />
          )}

          {/* Average line */}
          <ReferenceLine
            y={avg}
            stroke="#3b82f6"
            strokeWidth={1}
            strokeDasharray="3 3"
            label={{ value: 'Average', position: 'right', fill: '#3b82f6' }}
          />

          {/* Normal data line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.isAnomaly) return null;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={payload.isCompliant ? '#10b981' : '#f59e0b'}
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            }}
            name="Test Results"
          />

          {/* Anomaly markers */}
          {anomalyData.map((point, index) => (
            <ReferenceLine
              key={`anomaly-${index}`}
              x={point.date}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="3 3"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Anomaly List */}
      {anomalyData.length > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Detected Anomalies
          </h4>
          <div className="space-y-2">
            {anomalyData.map((anomaly, index) => (
              <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                <span className="font-medium text-gray-700">{anomaly.date}</span>
                <span className="text-red-600 font-bold">{anomaly.value.toFixed(2)}</span>
                <span className="text-gray-500">
                  {threshold && `${((anomaly.value / threshold) * 100).toFixed(0)}% of threshold`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, parameter }: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-white p-4 border-2 border-gray-200 rounded-lg shadow-xl">
      <p className="font-semibold text-gray-800 mb-2">{data.date}</p>
      <div className="space-y-1">
        <p className="text-sm">
          <span className="font-medium">{parameter}:</span>{' '}
          <span className={data.isAnomaly ? 'text-red-600 font-bold' : 'text-gray-800'}>
            {data.value.toFixed(3)}
          </span>
        </p>
        <p className="text-sm">
          <span className="font-medium">Status:</span>{' '}
          <span className={data.isCompliant ? 'text-green-600' : 'text-red-600'}>
            {data.isCompliant ? 'Compliant' : 'Non-compliant'}
          </span>
        </p>
        {data.isAnomaly && (
          <p className="text-sm text-red-600 font-semibold mt-2">
            ⚠️ Anomaly Detected
          </p>
        )}
      </div>
    </div>
  );
}
