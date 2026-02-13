import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ElevationChartProps {
  altitude: number[]; // in meters
  distance?: number[]; // in meters
}

const ElevationChart: React.FC<ElevationChartProps> = ({ altitude, distance }) => {
  const chartData = useMemo(() => {
    return altitude.map((alt, index) => {
      // Calculate grade percentage if we have distance data
      let grade = 0;
      if (distance && index > 0) {
        const elevChange = alt - altitude[index - 1];
        const distChange = distance[index] - distance[index - 1];
        if (distChange > 0) {
          grade = (elevChange / distChange) * 100;
        }
      }

      return {
        altitude: alt,
        distance: distance ? distance[index] / 1000 : index / 100, // convert to km
        grade: Math.abs(grade) < 50 ? grade : 0, // filter out unrealistic grades
      };
    });
  }, [altitude, distance]);

  // Calculate elevation statistics
  const elevStats = useMemo(() => {
    if (altitude.length === 0) return { gain: 0, loss: 0, max: 0, min: 0 };

    let gain = 0;
    let loss = 0;

    for (let i = 1; i < altitude.length; i++) {
      const diff = altitude[i] - altitude[i - 1];
      if (diff > 0) gain += diff;
      else if (diff < 0) loss += Math.abs(diff);
    }

    return {
      gain: Math.round(gain),
      loss: Math.round(loss),
      max: Math.round(Math.max(...altitude)),
      min: Math.round(Math.min(...altitude)),
    };
  }, [altitude]);

  // Find steepest climb
  const steepestClimb = useMemo(() => {
    let maxGrade = 0;
    let maxGradeIndex = 0;

    chartData.forEach((point, index) => {
      if (point.grade > maxGrade) {
        maxGrade = point.grade;
        maxGradeIndex = index;
      }
    });

    return {
      grade: maxGrade,
      distance: chartData[maxGradeIndex]?.distance || 0,
      altitude: chartData[maxGradeIndex]?.altitude || 0,
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">
            Distance: {data.distance.toFixed(2)} km
          </p>
          <p className="text-sm text-gray-700">
            Elevation: <span className="font-semibold">{data.altitude.toFixed(0)} m</span>
          </p>
          {Math.abs(data.grade) > 0.1 && (
            <p className="text-sm text-gray-600">
              Grade:{' '}
              <span
                className="font-semibold"
                style={{ color: data.grade > 0 ? '#ef4444' : '#10b981' }}
              >
                {data.grade > 0 ? '+' : ''}
                {data.grade.toFixed(1)}%
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Elevation stats */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Gain: </span>
          <span className="font-semibold text-green-600">{elevStats.gain} m</span>
        </div>
        <div>
          <span className="text-gray-600">Loss: </span>
          <span className="font-semibold text-red-600">{elevStats.loss} m</span>
        </div>
        <div>
          <span className="text-gray-600">High: </span>
          <span className="font-semibold text-gray-900">{elevStats.max} m</span>
        </div>
        <div>
          <span className="text-gray-600">Low: </span>
          <span className="font-semibold text-gray-900">{elevStats.min} m</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="distance"
            stroke="#6b7280"
            label={{
              value: 'Distance (km)',
              position: 'insideBottom',
              offset: -5,
            }}
            tickFormatter={(val: number) => val.toFixed(1)}
          />
          <YAxis
            stroke="#6b7280"
            label={{
              value: 'Elevation (m)',
              angle: -90,
              position: 'insideLeft',
            }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          
          <Area
            type="monotone"
            dataKey="altitude"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#elevGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Steepest climb info */}
      {steepestClimb.grade > 2 && (
        <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-orange-700">Steepest climb:</span>{' '}
            {steepestClimb.grade.toFixed(1)}% grade at {steepestClimb.distance.toFixed(2)} km
            ({steepestClimb.altitude.toFixed(0)} m)
          </p>
        </div>
      )}
    </div>
  );
};

export default ElevationChart;
