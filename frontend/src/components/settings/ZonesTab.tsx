import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const ZONE_COLORS = [
  '#9CA3AF', // Gray - Zone 1
  '#60A5FA', // Blue - Zone 2
  '#34D399', // Green - Zone 3
  '#FBBF24', // Yellow - Zone 4
  '#FB923C', // Orange - Zone 5
  '#F87171', // Red - Zone 6
  '#DC2626', // Dark Red - Zone 7
];

const ZONE_NAMES = {
  '3_zone': ['Easy', 'Moderate', 'Hard'],
  '5_zone': ['Recovery', 'Aerobic', 'Tempo', 'Threshold', 'Max'],
  '7_zone': ['Recovery', 'Easy', 'Aerobic', 'Tempo', 'Threshold', 'VO2 Max', 'Sprint'],
};

const ZonesTab: React.FC = () => {
  const { athlete } = useAuth();
  const { settings, updateSettings, changeZoneModel, getHRZones, loading, error } = useSettings();

  const [maxHR, setMaxHR] = useState(190);
  const [restHR, setRestHR] = useState(60);
  const [hrZones, setHrZones] = useState<number[]>([60, 70, 80, 90, 100]);
  const [paceZones, setPaceZones] = useState<number[]>([7.0, 6.0, 5.0, 4.5, 4.0]);
  const [zoneModel, setZoneModel] = useState<'3_zone' | '5_zone' | '7_zone'>('5_zone');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [validationError, setValidationError] = useState<string>('');

  // Load settings when available
  useEffect(() => {
    if (settings) {
      setMaxHR(settings.max_heart_rate);
      setRestHR(settings.rest_heart_rate);
      setHrZones(settings.hr_zones);
      setPaceZones(settings.pace_zones);
      setZoneModel(settings.zone_model_type);
    }
  }, [settings]);

  const validateZones = (): boolean => {
    // Validate HR zones
    for (let i = 0; i < hrZones.length - 1; i++) {
      if (hrZones[i] >= hrZones[i + 1]) {
        setValidationError('HR zones must be in strictly ascending order');
        return false;
      }
    }

    if (hrZones[hrZones.length - 1] !== 100) {
      setValidationError('Last HR zone must be 100%');
      return false;
    }

    // Validate pace zones
    for (let i = 0; i < paceZones.length - 1; i++) {
      if (paceZones[i] <= paceZones[i + 1]) {
        setValidationError('Pace zones must be in descending order (slower to faster)');
        return false;
      }
    }

    if (maxHR <= restHR) {
      setValidationError('Max HR must be greater than Rest HR');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleSave = async () => {
    if (!athlete?.id) return;
    
    if (!validateZones()) {
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');
    try {
      await updateSettings(athlete.id, {
        max_heart_rate: maxHR,
        rest_heart_rate: restHR,
        hr_zones: hrZones,
        pace_zones: paceZones,
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      console.error('Failed to save settings:', err);
    }
  };

  const handleZoneModelChange = async (newModel: '3_zone' | '5_zone' | '7_zone') => {
    if (!athlete?.id) return;

    const confirmed = window.confirm(
      'Changing the zone model will reset your zones to defaults. Continue?'
    );

    if (!confirmed) return;

    try {
      await changeZoneModel(athlete.id, newModel);
    } catch (err) {
      console.error('Failed to change zone model:', err);
    }
  };

  const handleResetZones = () => {
    if (!settings) return;
    
    const confirmed = window.confirm('Reset zones to defaults for current model?');
    if (confirmed) {
      setHrZones([...settings.hr_zones]);
      setPaceZones([...settings.pace_zones]);
    }
  };

  const formatPace = (pace: number): string => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculatedHRZones = getHRZones();
  const zoneNames = ZONE_NAMES[zoneModel];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Training Zones</h2>
        <p className="text-gray-600 text-sm mb-6">
          Configure your heart rate and pace training zones. These will be used throughout the app
          for analysis and visualization.
        </p>

        {/* Zone Model Selector */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-900 mb-2">Zone Model</label>
          <select
            value={zoneModel}
            onChange={(e) =>
              handleZoneModelChange(e.target.value as '3_zone' | '5_zone' | '7_zone')
            }
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
          >
            <option value="3_zone">3-Zone Model (Simple)</option>
            <option value="5_zone">5-Zone Model (Standard)</option>
            <option value="7_zone">7-Zone Model (Advanced)</option>
          </select>
          <p className="mt-2 text-sm text-gray-600">
            {zoneModel === '3_zone' && 'Simple 3-zone model: Easy, Moderate, Hard'}
            {zoneModel === '5_zone' && 'Standard 5-zone model for balanced training'}
            {zoneModel === '7_zone' && 'Advanced 7-zone model for precise training'}
          </p>
        </div>

        {/* Heart Rate Zones */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Heart Rate Zones</h3>

          {/* Max and Rest HR */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Max HR (BPM)</label>
              <input
                type="number"
                value={maxHR}
                onChange={(e) => setMaxHR(parseInt(e.target.value) || 190)}
                min={120}
                max={220}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rest HR (BPM)</label>
              <input
                type="number"
                value={restHR}
                onChange={(e) => setRestHR(parseInt(e.target.value) || 60)}
                min={30}
                max={100}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* HR Zone Editor */}
          <div className="space-y-3">
            {hrZones.map((zonePercent, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ZONE_COLORS[index] }}
                />
                <span className="w-20 text-sm font-medium text-gray-700">
                  Zone {index + 1}
                </span>
                <span className="w-24 text-sm text-gray-600">{zoneNames[index]}</span>
                <input
                  type="number"
                  value={zonePercent}
                  onChange={(e) => {
                    const newZones = [...hrZones];
                    newZones[index] = parseFloat(e.target.value) || 0;
                    setHrZones(newZones);
                  }}
                  step="1"
                  min="0"
                  max="100"
                  className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <span className="text-sm text-gray-500">%</span>
                {calculatedHRZones[index] && (
                  <span className="text-sm text-gray-600 ml-auto">
                    {calculatedHRZones[index].min} - {calculatedHRZones[index].max} BPM
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pace Zones */}
        <div className="space-y-4 mt-8">
          <h3 className="text-lg font-medium text-gray-900">Pace Zones</h3>
          <p className="text-sm text-gray-600">
            Pace zones in min/km (slower paces have higher values)
          </p>

          <div className="space-y-3">
            {paceZones.map((pace, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ZONE_COLORS[index] }}
                />
                <span className="w-20 text-sm font-medium text-gray-700">
                  Zone {index + 1}
                </span>
                <span className="w-24 text-sm text-gray-600">{zoneNames[index]}</span>
                <input
                  type="number"
                  value={pace}
                  onChange={(e) => {
                    const newZones = [...paceZones];
                    newZones[index] = parseFloat(e.target.value) || 0;
                    setPaceZones(newZones);
                  }}
                  step="0.1"
                  min="2.5"
                  max="10"
                  className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <span className="text-sm text-gray-500">min/km</span>
                <span className="text-sm text-gray-600 ml-auto">{formatPace(pace)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{validationError}</p>
          </div>
        )}

        {/* General Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center space-x-4">
          <button
            onClick={handleSave}
            disabled={loading || saveStatus === 'saving'}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              saveStatus === 'success'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`}
          >
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'success' && '✓ Saved'}
            {(saveStatus === 'idle' || saveStatus === 'error') && 'Save Changes'}
          </button>

          <button
            onClick={handleResetZones}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reset to Defaults
          </button>

          {saveStatus === 'success' && (
            <span className="text-sm text-green-600">Changes saved successfully!</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZonesTab;
