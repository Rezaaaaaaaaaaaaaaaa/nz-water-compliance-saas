/**
 * Waterfall Chart Component
 *
 * Shows compliance score breakdown with component contributions
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

export interface WaterfallData {
  name: string;
  value: number;
  isTotal?: boolean;
  color?: string;
}

interface WaterfallChartProps {
  data: WaterfallData[];
  height?: number;
  title?: string;
}

export function WaterfallChart({ data, height = 400, title }: WaterfallChartProps) {
  // Transform data for waterfall effect
  const transformedData = data.map((item, index) => {
    if (index === 0) {
      return { ...item, start: 0 };
    }

    const previousTotal = data.slice(0, index).reduce((sum, d) => sum + d.value, 0);
    return { ...item, start: previousTotal };
  });

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={transformedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[0, 100]}
            label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Legend />

          {/* Invisible bar to create waterfall effect */}
          <Bar dataKey="start" stackId="a" fill="transparent" />

          {/* Visible bar showing the value */}
          <Bar dataKey="value" stackId="a" name="Contribution" radius={[8, 8, 0, 0]}>
            {transformedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.isTotal
                    ? '#3b82f6'
                    : entry.value >= 0
                      ? '#10b981'
                      : '#ef4444'
                }
              />
            ))}
          </Bar>

          <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" label="Target" />
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-6 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Positive Contribution</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Negative Impact</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Total Score</span>
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-800 mb-2">{data.name}</p>
      <div className="space-y-1">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Value:</span> {data.value.toFixed(1)}
        </p>
        {data.start !== undefined && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Running Total:</span> {(data.start + data.value).toFixed(1)}
          </p>
        )}
      </div>
    </div>
  );
}
