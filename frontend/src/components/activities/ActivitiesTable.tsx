import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterBar from './FilterBar';

interface Activity {
  id: number;
  name: string;
  start_date: string;
  distance: number;
  moving_time: number;
  average_speed: number;
  average_heartrate: number | null;
  total_elevation_gain: number;
  calories: number | null;
  type: string;
}

interface ActivitiesTableProps {
  athleteId: number;
}

const ActivitiesTable: React.FC<ActivitiesTableProps> = ({ athleteId }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState('start_date');
  const [order, setOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [activityType, setActivityType] = useState('');

  useEffect(() => {
    fetchActivities();
  }, [athleteId, page, limit, sortBy, order, activityType]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 0) setPage(0);
      else fetchActivities();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const offset = page * limit;
      let url = `http://localhost:8000/api/v1/activities/${athleteId}?limit=${limit}&offset=${offset}&sort_by=${sortBy}&order=${order}`;
      if (activityType) {
        url += `&activity_type=${activityType}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      
      // Client-side search filter
      let filteredActivities = data.activities;
      if (searchQuery) {
        filteredActivities = data.activities.filter((activity: Activity) =>
          activity.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setActivities(filteredActivities);
      setTotal(searchQuery ? filteredActivities.length : data.total);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleTypeFilter = (type: string) => {
    setActivityType(type);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActivityType('');
    setSortBy('start_date');
    setOrder('desc');
    setPage(0);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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

  const formatPace = (speed: number) => {
    // speed is in m/s, convert to min/km
    if (!speed || speed === 0) return '--';
    const paceMinPerKm = (1000 / speed) / 60;
    const mins = Math.floor(paceMinPerKm);
    const secs = Math.floor((paceMinPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2);
  };

  const totalPages = Math.ceil(total / limit);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) {
      return <span className="text-xs text-gray-400">↕</span>;
    }
    return order === 'asc' ? (
      <span className="text-xs text-blue-600">↑</span>
    ) : (
      <span className="text-xs text-blue-600">↓</span>
    );
  };

  if (loading && activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <p className="text-gray-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (!loading && activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Yet</h3>
          <p className="text-gray-600">Sync your activities from Strava to see them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <FilterBar
        onSearch={handleSearch}
        onTypeFilter={handleTypeFilter}
        onClearFilters={handleClearFilters}
        activityType={activityType}
      />

      {/* Table Container */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('start_date')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    <SortIcon field="start_date" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('distance')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Distance</span>
                    <SortIcon field="distance" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('moving_time')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Duration</span>
                    <SortIcon field="moving_time" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pace
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heart Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Elevation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calories
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr 
                  key={activity.id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/activities/${activity.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(activity.start_date)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <div className="max-w-xs truncate">{activity.name}</div>
                    <div className="text-xs text-gray-500">{activity.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDistance(activity.distance)} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(activity.moving_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPace(activity.average_speed)} /km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {activity.average_heartrate ? Math.round(activity.average_heartrate) : '--'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(activity.total_elevation_gain)} m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.calories ? Math.round(activity.calories) : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Showing <span className="font-medium">{page * limit + 1}</span> to{' '}
                <span className="font-medium">{Math.min((page + 1) * limit, total)}</span> of{' '}
                <span className="font-medium">{total}</span> activities
              </span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(0);
                }}
                className="ml-4 border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center space-x-1">
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const pageNum = page < 3 ? i : page - 2 + i;
                if (pageNum >= totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 border rounded text-sm font-medium ${
                      page === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ActivitiesTable;
