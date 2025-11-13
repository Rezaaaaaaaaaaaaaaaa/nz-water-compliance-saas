/**
 * Risk Heat Map Component
 *
 * Matrix visualization showing risk distribution across asset types and conditions
 */

'use client';

interface RiskHeatMapData {
  assetType: string;
  condition: string;
  count: number;
  riskScore: number; // 0-100
}

interface RiskHeatMapProps {
  data: RiskHeatMapData[];
  width?: number;
  height?: number;
}

const assetTypes = [
  'Treatment Plant',
  'Reservoir',
  'Pump Station',
  'Pipeline',
  'Bore',
  'Other',
];

const conditions = [
  'Excellent',
  'Good',
  'Fair',
  'Poor',
  'Very Poor',
];

export function RiskHeatMap({ data, width = 800, height = 400 }: RiskHeatMapProps) {
  // Create matrix from data
  const matrix: Map<string, RiskHeatMapData> = new Map();
  data.forEach(item => {
    const key = `${item.assetType}:${item.condition}`;
    matrix.set(key, item);
  });

  // Calculate cell dimensions
  const cellWidth = (width - 150) / conditions.length;
  const cellHeight = (height - 80) / assetTypes.length;

  // Get risk color
  const getRiskColor = (score: number): string => {
    if (score >= 80) return '#ef4444'; // Red
    if (score >= 60) return '#f97316'; // Orange
    if (score >= 40) return '#f59e0b'; // Amber
    if (score >= 20) return '#eab308'; // Yellow
    return '#10b981'; // Green
  };

  // Get max count for scaling
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Asset Risk Heat Map
        </h3>
        <p className="text-sm text-gray-600">
          Risk distribution across asset types and conditions. Darker colors indicate higher risk.
        </p>
      </div>

      {/* Heat Map */}
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="border border-gray-200 rounded-lg">
          {/* Column headers (conditions) */}
          {conditions.map((condition, colIndex) => (
            <text
              key={`col-${colIndex}`}
              x={150 + colIndex * cellWidth + cellWidth / 2}
              y={30}
              textAnchor="middle"
              className="text-xs font-semibold fill-gray-700"
            >
              {condition}
            </text>
          ))}

          {/* Row headers (asset types) */}
          {assetTypes.map((assetType, rowIndex) => (
            <text
              key={`row-${rowIndex}`}
              x={10}
              y={60 + rowIndex * cellHeight + cellHeight / 2}
              textAnchor="start"
              alignmentBaseline="middle"
              className="text-xs font-semibold fill-gray-700"
            >
              {assetType}
            </text>
          ))}

          {/* Heat map cells */}
          {assetTypes.map((assetType, rowIndex) =>
            conditions.map((condition, colIndex) => {
              const key = `${assetType}:${condition}`;
              const cellData = matrix.get(key);
              const count = cellData?.count || 0;
              const riskScore = cellData?.riskScore || 0;
              const color = getRiskColor(riskScore);
              const opacity = count > 0 ? 0.3 + (count / maxCount) * 0.7 : 0.1;

              return (
                <g key={key}>
                  {/* Cell background */}
                  <rect
                    x={150 + colIndex * cellWidth}
                    y={50 + rowIndex * cellHeight}
                    width={cellWidth - 2}
                    height={cellHeight - 2}
                    fill={count > 0 ? color : '#f3f4f6'}
                    opacity={opacity}
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                    rx={4}
                  >
                    <title>
                      {assetType} - {condition}
                      {'\n'}Count: {count}
                      {'\n'}Risk Score: {riskScore.toFixed(1)}
                    </title>
                  </rect>

                  {/* Cell value */}
                  {count > 0 && (
                    <text
                      x={150 + colIndex * cellWidth + cellWidth / 2}
                      y={50 + rowIndex * cellHeight + cellHeight / 2}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      className="text-sm font-bold fill-white pointer-events-none"
                      style={{
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                      }}
                    >
                      {count}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Risk Score Legend</h4>
          <div className="flex items-center gap-4">
            {[
              { label: 'Low (0-20)', color: '#10b981' },
              { label: 'Low-Med (20-40)', color: '#eab308' },
              { label: 'Medium (40-60)', color: '#f59e0b' },
              { label: 'Med-High (60-80)', color: '#f97316' },
              { label: 'High (80-100)', color: '#ef4444' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-white shadow"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{data.reduce((sum, d) => sum + d.count, 0)}</span>{' '}
            total assets
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Cell intensity shows asset count
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <StatCard
          title="High Risk"
          value={data.filter(d => d.riskScore >= 60).reduce((sum, d) => sum + d.count, 0)}
          color="red"
        />
        <StatCard
          title="Medium Risk"
          value={data.filter(d => d.riskScore >= 40 && d.riskScore < 60).reduce((sum, d) => sum + d.count, 0)}
          color="orange"
        />
        <StatCard
          title="Low Risk"
          value={data.filter(d => d.riskScore < 40).reduce((sum, d) => sum + d.count, 0)}
          color="green"
        />
        <StatCard
          title="Average Risk"
          value={Math.round(
            data.reduce((sum, d) => sum + d.riskScore * d.count, 0) /
            data.reduce((sum, d) => sum + d.count, 1)
          )}
          color="blue"
          suffix="/100"
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
  suffix = '',
}: {
  title: string;
  value: number;
  color: string;
  suffix?: string;
}) {
  const colorClasses = {
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
  }[color];

  return (
    <div className={`p-4 rounded-lg ${colorClasses}`}>
      <p className="text-sm opacity-80">{title}</p>
      <p className="text-2xl font-bold mt-1">
        {value}
        {suffix && <span className="text-base opacity-70">{suffix}</span>}
      </p>
    </div>
  );
}
