/**
 * Capacity Utilization Gauge
 *
 * Circular gauge showing asset capacity utilization percentage
 */

'use client';

interface CapacityGaugeProps {
  value: number; // 0-100
  capacity: number;
  current: number;
  label: string;
  unit?: string;
  size?: number;
  thresholds?: {
    warning: number; // e.g., 80
    critical: number; // e.g., 95
  };
}

export function CapacityGauge({
  value,
  capacity,
  current,
  label,
  unit = 'units',
  size = 200,
  thresholds = { warning: 80, critical: 95 }
}: CapacityGaugeProps) {
  // Determine color based on value
  const getColor = (val: number): string => {
    if (val >= thresholds.critical) return '#ef4444'; // Red
    if (val >= thresholds.warning) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  const color = getColor(value);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* SVG Gauge */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold" style={{ color }}>
            {value.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-500 mt-1">utilized</div>
        </div>
      </div>

      {/* Label */}
      <div className="mt-4 text-center">
        <h4 className="font-semibold text-gray-800">{label}</h4>
        <p className="text-sm text-gray-600 mt-1">
          {current.toLocaleString()} / {capacity.toLocaleString()} {unit}
        </p>
      </div>

      {/* Status indicator */}
      <div className="mt-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
        <span className="text-sm font-medium" style={{ color }}>
          {value >= thresholds.critical
            ? 'Critical'
            : value >= thresholds.warning
              ? 'Warning'
              : 'Normal'}
        </span>
      </div>

      {/* Threshold legend */}
      <div className="mt-4 space-y-1 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Normal (&lt; {thresholds.warning}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span>Warning ({thresholds.warning}% - {thresholds.critical}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Critical (&gt; {thresholds.critical}%)</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Multiple Gauges Grid
 */
interface MultiGaugeProps {
  gauges: Array<Omit<CapacityGaugeProps, 'size'>>;
  columns?: number;
}

export function MultiGauge({ gauges, columns = 3 }: MultiGaugeProps) {
  return (
    <div className={`grid grid-cols-${columns} gap-8`}>
      {gauges.map((gauge, index) => (
        <CapacityGauge key={index} {...gauge} size={180} />
      ))}
    </div>
  );
}
