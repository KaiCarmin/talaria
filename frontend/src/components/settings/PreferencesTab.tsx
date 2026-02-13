import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const PreferencesTab: React.FC = () => {
  const { athlete } = useAuth();
  const { settings, updateSettings } = useSettings();

  const [calendarStartDay, setCalendarStartDay] = useState<'monday' | 'sunday'>('monday');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'miles'>('km');
  const [temperatureUnit, setTemperatureUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Load settings when available
  useEffect(() => {
    if (settings) {
      setCalendarStartDay(settings.calendar_start_day);
      setDistanceUnit(settings.distance_unit);
      setTemperatureUnit(settings.temperature_unit);
    }
  }, [settings]);

  // Auto-save when preferences change (with debounce)
  useEffect(() => {
    if (!settings || !athlete?.id) return;

    const hasChanged =
      calendarStartDay !== settings.calendar_start_day ||
      distanceUnit !== settings.distance_unit ||
      temperatureUnit !== settings.temperature_unit;

    if (!hasChanged) return;

    const timeoutId = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await updateSettings(athlete.id, {
          calendar_start_day: calendarStartDay,
          distance_unit: distanceUnit,
          temperature_unit: temperatureUnit,
        });
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Failed to save preferences:', err);
        setSaveStatus('idle');
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [calendarStartDay, distanceUnit, temperatureUnit, athlete?.id, settings]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
        <p className="text-gray-600 text-sm mb-6">
          Customize how data is displayed throughout the app. Changes are saved automatically.
        </p>

        {/* Save Status Indicator */}
        {saveStatus !== 'idle' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              {saveStatus === 'saving' && '💾 Saving preferences...'}
              {saveStatus === 'success' && '✓ Preferences saved!'}
            </p>
          </div>
        )}

        {/* Calendar Preferences */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-medium text-gray-900">Calendar</h3>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Start week on
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="monday"
                  checked={calendarStartDay === 'monday'}
                  onChange={(e) => setCalendarStartDay(e.target.value as 'monday')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-700">Monday</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="sunday"
                  checked={calendarStartDay === 'sunday'}
                  onChange={(e) => setCalendarStartDay(e.target.value as 'sunday')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-700">Sunday</span>
              </label>
            </div>

            {/* Mini Calendar Preview */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {calendarStartDay === 'monday' ? (
                  <>
                    <div className="font-medium text-gray-600">M</div>
                    <div className="font-medium text-gray-600">T</div>
                    <div className="font-medium text-gray-600">W</div>
                    <div className="font-medium text-gray-600">T</div>
                    <div className="font-medium text-gray-600">F</div>
                    <div className="font-medium text-blue-600">S</div>
                    <div className="font-medium text-blue-600">S</div>
                  </>
                ) : (
                  <>
                    <div className="font-medium text-blue-600">S</div>
                    <div className="font-medium text-gray-600">M</div>
                    <div className="font-medium text-gray-600">T</div>
                    <div className="font-medium text-gray-600">W</div>
                    <div className="font-medium text-gray-600">T</div>
                    <div className="font-medium text-gray-600">F</div>
                    <div className="font-medium text-blue-600">S</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Unit Preferences */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-medium text-gray-900">Units</h3>

          {/* Distance Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distance
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="km"
                  checked={distanceUnit === 'km'}
                  onChange={(e) => setDistanceUnit(e.target.value as 'km')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Kilometers (km)
                  <span className="text-gray-500 ml-2">5.00 km, 4:30 /km</span>
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="miles"
                  checked={distanceUnit === 'miles'}
                  onChange={(e) => setDistanceUnit(e.target.value as 'miles')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Miles (mi)
                  <span className="text-gray-500 ml-2">3.11 mi, 7:15 /mi</span>
                </span>
              </label>
            </div>
          </div>

          {/* Temperature Unit */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature
              <span className="text-gray-500 text-xs ml-2">(for future weather features)</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="celsius"
                  checked={temperatureUnit === 'celsius'}
                  onChange={(e) => setTemperatureUnit(e.target.value as 'celsius')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Celsius (°C)
                  <span className="text-gray-500 ml-2">20°C</span>
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="fahrenheit"
                  checked={temperatureUnit === 'fahrenheit'}
                  onChange={(e) => setTemperatureUnit(e.target.value as 'fahrenheit')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Fahrenheit (°F)
                  <span className="text-gray-500 ml-2">68°F</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Display Preferences (Future) */}
        <div className="space-y-4 opacity-50 pointer-events-none">
          <h3 className="text-lg font-medium text-gray-900">Display</h3>
          <p className="text-sm text-gray-500">
            Theme and appearance settings coming soon...
          </p>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                disabled
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700">Light Theme</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                disabled
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700">Dark Theme</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                disabled
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700">Auto (System)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesTab;
