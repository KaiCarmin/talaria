import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Dashboard = () => {
  const { athlete } = useAuth();
  
  // Sync state management
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [syncData, setSyncData] = useState<{
    activities_synced: number;
    activities_updated: number;
    total: number;
  } | null>(null);

  const handleSync = async () => {
    if (!athlete?.id) {
      setSyncStatus({
        type: 'error',
        message: 'Athlete ID not found. Please re-authenticate.'
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: null, message: '' });
    setSyncData(null);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/sync/${athlete.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to sync activities');
      }

      setSyncData({
        activities_synced: data.activities_synced,
        activities_updated: data.activities_updated,
        total: data.total
      });
      
      setSyncStatus({
        type: 'success',
        message: data.message || 'Sync completed successfully!'
      });
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to sync activities'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <div>
        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {athlete?.firstname}! Here's an overview of your training.
          </p>
        </div>
        {/* Sync Button Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sync Activities</h2>
          <p className="text-gray-600 mb-4">
            Fetch your latest activities from Strava and store them for analysis.
          </p>
          
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              isSyncing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {isSyncing ? '⏳ Syncing...' : '🔄 Sync Activities from Strava'}
          </button>

          {/* Sync Status Messages */}
          {syncStatus.type && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                syncStatus.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <strong>{syncStatus.type === 'success' ? '✅ Success!' : '❌ Error'}</strong>
              <p className="mt-1">{syncStatus.message}</p>
              
              {syncData && (
                <div className="mt-2 text-sm space-y-1">
                  <p>📥 New activities: <strong>{syncData.activities_synced}</strong></p>
                  <p>🔄 Updated activities: <strong>{syncData.activities_updated}</strong></p>
                  <p>📊 Total processed: <strong>{syncData.total}</strong></p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats Grid - Placeholder for future stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Distance</p>
                <p className="text-2xl font-bold text-gray-900">-- km</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Time</p>
                <p className="text-2xl font-bold text-gray-900">-- hrs</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Your Dashboard! 🎉</h2>
          <p className="text-lg text-gray-600 mb-6">
            You're successfully authenticated with Strava.
          </p>
          <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">📊</span>
                <span>Activity list and visualization</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📈</span>
                <span>Performance charts and analytics</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🗺️</span>
                <span>Route maps with Leaflet</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🤖</span>
                <span>AI-powered coaching insights</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
