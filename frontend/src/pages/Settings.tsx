import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import ZonesTab from '../components/settings/ZonesTab';
import PreferencesTab from '../components/settings/PreferencesTab';

const Settings: React.FC = () => {
  const { athlete } = useAuth();
  const { fetchSettings, loading: settingsLoading } = useSettings();
  const [activeTab, setActiveTab] = useState<'profile' | 'zones' | 'preferences'>('zones');

  useEffect(() => {
    if (athlete?.id) {
      fetchSettings(athlete.id);
    }
  }, [athlete?.id]);

  if (!athlete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Customize your training zones, units, and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('zones')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'zones'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Training Zones
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'preferences'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Preferences
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {settingsLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {!settingsLoading && (
              <>
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <p className="text-gray-600 text-sm">
                      Your profile information is synced from Strava and cannot be edited here.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="mt-1 text-gray-900">
                          {athlete.firstname} {athlete.lastname}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Strava ID</label>
                        <p className="mt-1 text-gray-900">{athlete.strava_id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Member Since
                        </label>
                        <p className="mt-1 text-gray-900">
                          {athlete.created_at 
                            ? new Date(athlete.created_at).toLocaleDateString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'zones' && <ZonesTab />}

                {activeTab === 'preferences' && <PreferencesTab />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
