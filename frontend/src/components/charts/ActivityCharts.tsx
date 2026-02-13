import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PaceChart from './PaceChart';
import HeartRateChart from './HeartRateChart';
import ElevationChart from './ElevationChart';

interface StreamData {
  time?: { data: number[] };
  distance?: { data: number[] };
  altitude?: { data: number[] };
  velocity_smooth?: { data: number[] };
  heartrate?: { data: number[] };
  cadence?: { data: number[] };
  latlng?: { data: [number, number][] };
}

interface ActivityChartsProps {
  activityId: number;
}

const ActivityCharts: React.FC<ActivityChartsProps> = ({ activityId }) => {
  const { athlete } = useAuth();
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (athlete && activityId) {
      fetchStreamData();
    }
  }, [athlete, activityId]);

  const fetchStreamData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/activities/${athlete!.id}/${activityId}/streams`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch stream data');
      }
      
      const data = await response.json();
      setStreamData(data);
    } catch (err) {
      console.error('Error fetching stream data:', err);
      setError('Failed to load activity data for charts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <p className="text-center text-gray-600">Loading activity data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <p className="text-center text-gray-600">{error}</p>
      </div>
    );
  }

  if (!streamData || Object.keys(streamData).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <p className="text-center text-gray-600">
          No detailed activity data available for this activity.
        </p>
      </div>
    );
  }

  const hasPaceData = streamData.velocity_smooth && streamData.distance;
  const hasHrData = streamData.heartrate;
  const hasElevationData = streamData.altitude;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Activity Charts</h2>
        
        <div className="space-y-8">
          {/* Pace Chart */}
          {hasPaceData && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pace</h3>
              <PaceChart 
                distance={streamData.distance!.data}
                velocity={streamData.velocity_smooth!.data}
                time={streamData.time?.data}
              />
            </div>
          )}

          {/* Heart Rate Chart */}
          {hasHrData && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Heart Rate</h3>
              <HeartRateChart 
                heartrate={streamData.heartrate!.data}
                time={streamData.time?.data}
                distance={streamData.distance?.data}
              />
            </div>
          )}

          {/* Elevation Chart */}
          {hasElevationData && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Elevation</h3>
              <ElevationChart 
                altitude={streamData.altitude!.data}
                distance={streamData.distance?.data}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityCharts;
