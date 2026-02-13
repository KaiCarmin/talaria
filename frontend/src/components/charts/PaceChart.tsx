import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface PaceChartProps {
  distance: number[]; // in meters
  velocity: number[]; // in meters per second
  time?: number[]; // in seconds
}

const PaceChart: React.FC<PaceChartProps> = ({ distance, velocity, time }) => {
  const [xAxisMode, setXAxisMode] = useState<'distance' | 'time'>('distance');

  // Convert velocity (m/s) to pace (min/km)
  const velocityToPace = (vel: number): number => {
    if (vel === 0) return 0;
    return 1000 / (vel * 60); // minutes per km
  };

  // Format pace for display (min:sec per km)
  const formatPace = (pace: number): string => {
    if (pace === 0 || !isFinite(pace)) return '--:--';
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const chartData = useMemo(() => {
    return distance.map((dist, index) => {
      const pace = velocityToPace(velocity[index]);
      return {
        distance: dist / 1000, // convert to km
        time: time ? time[index] / 60 : index, // convert to minutes
        pace: pace > 0 && pace < 20 ? pace : null, // filter out invalid paces
        paceDisplay: formatPace(pace),
      };
    });
  }, [distance, velocity, time]);

  // Calculate average pace
  const avgPace = useMemo(() => {
    const validPaces = chartData
      .map(d => d.pace)
      .filter((p): p is number => p !== null && p > 0);
    if (validPaces.length === 0) return 0;
    return validPaces.reduce((a, b) => a + b, 0) / validPaces.length;
  }, [chartData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">
            {xAxisMode === 'distance'
              ? `Distance: ${data.distance.toFixed(2)} km`
              : `Time: ${data.time.toFixed(1)} min`}
          </p>
          <p className="text-sm text-gray-700">
            Pace: <span className="font-semibold">{data.paceDisplay}/km</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Toggle button for X-axis mode */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={() =>
            setXAxisMode(xAxisMode === 'distance' ? 'time' : 'distance')
          }
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Show by {xAxisMode === 'distance' ? 'Time' : 'Distance'}
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xAxisMode}
            stroke="#6b7280"
            label={{
              value: xAxisMode === 'distance' ? 'Distance (km)' : 'Time (min)',
              position: 'insideBottom',
              offset: -5,
            }}
            tickFormatter={(val: number) => val.toFixed(1)}
          />
          <YAxis
            stroke="#6b7280"
            label={{
              value: 'Pace (min/km)',
              angle: -90,
              position: 'insideLeft',
            }}
            tickFormatter={(val: number) => formatPace(val)}
            domain={[0, 'auto']}
            reversed
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Average pace reference line */}
          {avgPace > 0 && (
            <ReferenceLine
              y={avgPace}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `Avg: ${formatPace(avgPace)}`,
                position: 'right',
                fill: '#f59e0b',
                fontSize: 12,
              }}
            />
          )}
          
          <Line
            type="monotone"
            dataKey="pace"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PaceChart;
