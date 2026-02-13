import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ActivityCharts from '../components/charts/ActivityCharts';

interface Activity {
  id: number;
  strava_id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number | null;
  max_speed: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  has_heartrate: boolean;
  average_cadence: number | null;
  elev_high: number | null;
  elev_low: number | null;
  calories: number | null;
  achievement_count: number | null;
  kudos_count: number | null;
  coordinates: [number, number][];
  splits: Split[];
}

interface Split {
  split: number;
  distance: number;
  time: number;
  pace: number;
}

const ActivityDetail: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const { athlete } = useAuth();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (athlete && activityId) {
      fetchActivityDetail();
    }
  }, [athlete, activityId]);

  const fetchActivityDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/activities/${athlete!.id}/${activityId}`
      );
      const data = await response.json();
      setActivity(data);
    } catch (error) {
      console.error('Error fetching activity detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2);
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (speed: number | null) => {
    if (!speed || speed === 0) return '--';
    const paceMinPerKm = (1000 / speed) / 60;
    const mins = Math.floor(paceMinPerKm);
    const secs = Math.floor((paceMinPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!athlete) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Please log in to view activity details.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading activity...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Activity not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <button
              onClick={() => navigate('/activities')}
              className="text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              ← Back to Activities
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{activity.name}</h1>
            <p className="text-gray-600 mt-1">{formatDate(activity.start_date_local)}</p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {activity.type}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Distance */}
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 mb-1">Distance</p>
          <p className="text-2xl font-bold text-gray-900">{formatDistance(activity.distance)} km</p>
        </div>

        {/* Moving Time */}
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 mb-1">Moving Time</p>
          <p className="text-2xl font-bold text-gray-900">{formatDuration(activity.moving_time)}</p>
        </div>

        {/* Average Pace */}
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 mb-1">Avg Pace</p>
          <p className="text-2xl font-bold text-gray-900">{formatPace(activity.average_speed)} /km</p>
        </div>

        {/* Elevation */}
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 mb-1">Elevation Gain</p>
          <p className="text-2xl font-bold text-gray-900">{Math.round(activity.total_elevation_gain)} m</p>
        </div>

        {/* Heart Rate */}
        {activity.has_heartrate && (
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 mb-1">Avg Heart Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {activity.average_heartrate ? Math.round(activity.average_heartrate) : '--'} bpm
            </p>
          </div>
        )}

        {/* Cadence */}
        {activity.average_cadence && (
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 mb-1">Avg Cadence</p>
            <p className="text-2xl font-bold text-gray-900">{Math.round(activity.average_cadence * 2)} spm</p>
          </div>
        )}

        {/* Calories */}
        {activity.calories && (
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 mb-1">Calories</p>
            <p className="text-2xl font-bold text-gray-900">{Math.round(activity.calories)}</p>
          </div>
        )}

        {/* Elapsed Time */}
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 mb-1">Elapsed Time</p>
          <p className="text-2xl font-bold text-gray-900">{formatDuration(activity.elapsed_time)}</p>
        </div>
      </div>

      {/* Map Placeholder */}
      {activity.coordinates && activity.coordinates.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Route Map</h2>
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 mb-2">Map visualization</p>
              <p className="text-sm text-gray-500">{activity.coordinates.length} coordinates loaded</p>
              <p className="text-xs text-gray-400 mt-2">Map integration coming soon</p>
            </div>
          </div>
        </div>
      )}

      {/* Activity Charts */}
      <ActivityCharts activityId={activity.id} />

      {/* Splits Table */}
      {activity.splits && activity.splits.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Splits</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kilometer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pace
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activity.splits.map((split) => (
                  <tr key={split.split} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {split.split}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(split.distance / 1000).toFixed(2)} km
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(split.time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.floor(split.pace)}:{Math.round((split.pace % 1) * 60).toString().padStart(2, '0')} /km
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Metadata */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {activity.kudos_count !== null && (
            <div>
              <p className="text-gray-500">Kudos</p>
              <p className="font-medium text-gray-900">{activity.kudos_count}</p>
            </div>
          )}
          {activity.achievement_count !== null && (
            <div>
              <p className="text-gray-500">Achievements</p>
              <p className="font-medium text-gray-900">{activity.achievement_count}</p>
            </div>
          )}
          {activity.max_speed && (
            <div>
              <p className="text-gray-500">Max Speed</p>
              <p className="font-medium text-gray-900">{formatPace(activity.max_speed)} /km</p>
            </div>
          )}
          {activity.max_heartrate && (
            <div>
              <p className="text-gray-500">Max Heart Rate</p>
              <p className="font-medium text-gray-900">{activity.max_heartrate} bpm</p>
            </div>
          )}
          {activity.elev_high !== null && (
            <div>
              <p className="text-gray-500">Elevation High</p>
              <p className="font-medium text-gray-900">{Math.round(activity.elev_high)} m</p>
            </div>
          )}
          {activity.elev_low !== null && (
            <div>
              <p className="text-gray-500">Elevation Low</p>
              <p className="font-medium text-gray-900">{Math.round(activity.elev_low)} m</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;
