import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface HeartRateChartProps {
  heartrate: number[];
  time?: number[]; // in seconds
  distance?: number[]; // in meters
}

// Default HR zones (can be replaced with user settings later)
const DEFAULT_HR_ZONES = [
  { name: 'Zone 1 (Easy)', min: 0, max: 142, color: '#94a3b8' }, // gray
  { name: 'Zone 2 (Moderate)', min: 142, max: 155, color: '#60a5fa' }, // blue
  { name: 'Zone 3 (Tempo)', min: 155, max: 168, color: '#34d399' }, // green
  { name: 'Zone 4 (Threshold)', min: 168, max: 181, color: '#fbbf24' }, // yellow
  { name: 'Zone 5 (Max)', min: 181, max: 220, color: '#f87171' }, // red
];

const HeartRateChart: React.FC<HeartRateChartProps> = ({ heartrate, time, distance }) => {
  const [xAxisMode, setXAxisMode] = useState<'distance' | 'time'>('distance');

  const chartData = useMemo(() => {
    return heartrate.map((hr, index) => ({
      heartrate: hr,
      distance: distance ? distance[index] / 1000 : index / 100, // convert to km
      time: time ? time[index] / 60 : index, // convert to minutes
    }));
  }, [heartrate, distance, time]);

  // Calculate HR statistics
  const hrStats = useMemo(() => {
    const validHR = heartrate.filter(hr => hr > 0);
    if (validHR.length === 0) return { avg: 0, max: 0, min: 0 };

    return {
      avg: Math.round(validHR.reduce((a, b) => a + b, 0) / validHR.length),
      max: Math.max(...validHR),
      min: Math.min(...validHR),
    };
  }, [heartrate]);

  // Calculate time in zones
  const timeInZones = useMemo(() => {
    const zoneCounts = DEFAULT_HR_ZONES.map(zone => ({
      ...zone,
      count: 0,
    }));

    heartrate.forEach(hr => {
      if (hr === 0) return;
      const zone = zoneCounts.find(z => hr >= z.min && hr < z.max);
      if (zone) zone.count++;
    });

    return zoneCounts.map(zone => ({
      ...zone,
      percentage: heartrate.length > 0 ? (zone.count / heartrate.length) * 100 : 0,
    }));
  }, [heartrate]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const zone = DEFAULT_HR_ZONES.find(
        z => data.heartrate >= z.min && data.heartrate < z.max
      );

      return (
        <div className="bg-white p-3 shadow-lg rounded border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">
            {xAxisMode === 'distance'
              ? `Distance: ${data.distance.toFixed(2)} km`
              : `Time: ${data.time.toFixed(1)} min`}
          </p>
          <p className="text-sm text-gray-700">
            HR: <span className="font-semibold">{data.heartrate} bpm</span>
          </p>
          {zone && (
            <p className="text-sm text-gray-600" style={{ color: zone.color }}>
              {zone.name}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Toggle button and stats */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-600">Avg: </span>
            <span className="font-semibold text-gray-900">{hrStats.avg} bpm</span>
          </div>
          <div>
            <span className="text-gray-600">Max: </span>
            <span className="font-semibold text-gray-900">{hrStats.max} bpm</span>
          </div>
        </div>
        
        {distance && time && (
          <button
            onClick={() =>
              setXAxisMode(xAxisMode === 'distance' ? 'time' : 'distance')
            }
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Show by {xAxisMode === 'distance' ? 'Time' : 'Distance'}
          </button>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
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
              value: 'Heart Rate (bpm)',
              angle: -90,
              position: 'insideLeft',
            }}
            domain={[0, 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Average HR reference line */}
          <ReferenceLine
            y={hrStats.avg}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `Avg: ${hrStats.avg}`,
              position: 'right',
              fill: '#f59e0b',
              fontSize: 12,
            }}
          />
          
          <Area
            type="monotone"
            dataKey="heartrate"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#hrGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Time in Zones */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Time in Zones</h4>
        <div className="space-y-2">
          {timeInZones.map((zone, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: zone.color }}
              />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{zone.name}</span>
                  <span className="text-gray-900 font-semibold">
                    {zone.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${zone.percentage}%`,
                      backgroundColor: zone.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeartRateChart;
