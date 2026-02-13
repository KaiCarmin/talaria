import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface UserSettings {
  id?: number;
  athlete_id: number;
  zone_model_type: '3_zone' | '5_zone' | '7_zone';
  max_heart_rate: number;
  rest_heart_rate: number;
  hr_zones: number[];
  pace_zones: number[];
  calendar_start_day: 'monday' | 'sunday';
  distance_unit: 'km' | 'miles';
  temperature_unit: 'celsius' | 'fahrenheit';
  created_at?: string;
  updated_at?: string;
}

interface HRZone {
  min: number;
  max: number;
}

interface PaceZone {
  slower: number;
  faster: number;
}

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  fetchSettings: (athleteId: number) => Promise<void>;
  updateSettings: (athleteId: number, updates: Partial<UserSettings>) => Promise<void>;
  resetSettings: (athleteId: number) => Promise<void>;
  changeZoneModel: (athleteId: number, zoneModel: '3_zone' | '5_zone' | '7_zone') => Promise<void>;
  getHRZones: () => HRZone[];
  getPaceZones: () => PaceZone[];
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem('user_settings');
    if (cached) {
      try {
        setSettings(JSON.parse(cached));
      } catch (e) {
        console.error('Failed to parse cached settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (settings) {
      localStorage.setItem('user_settings', JSON.stringify(settings));
    }
  }, [settings]);

  const fetchSettings = async (athleteId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/settings/${athleteId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(errorMsg);
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (athleteId: number, updates: Partial<UserSettings>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/settings/${athleteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to update settings: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMsg);
      console.error('Error updating settings:', err);
      throw err; // Re-throw so caller can handle it
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async (athleteId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/settings/${athleteId}/reset`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to reset settings: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reset settings';
      setError(errorMsg);
      console.error('Error resetting settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changeZoneModel = async (athleteId: number, zoneModel: '3_zone' | '5_zone' | '7_zone') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/settings/${athleteId}/change-zone-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zone_model_type: zoneModel }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to change zone model: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to change zone model';
      setError(errorMsg);
      console.error('Error changing zone model:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getHRZones = (): HRZone[] => {
    if (!settings) return [];
    
    const zones: HRZone[] = [];
    let previousMax = settings.rest_heart_rate;
    
    for (const zonePercent of settings.hr_zones) {
      const zoneMax = Math.round(settings.max_heart_rate * zonePercent / 100);
      zones.push({ min: previousMax, max: zoneMax });
      previousMax = zoneMax;
    }
    
    return zones;
  };

  const getPaceZones = (): PaceZone[] => {
    if (!settings) return [];
    
    const zones: PaceZone[] = [];
    let previousSlower = Infinity;
    
    for (const paceThreshold of settings.pace_zones) {
      zones.push({ slower: previousSlower, faster: paceThreshold });
      previousSlower = paceThreshold;
    }
    
    return zones;
  };

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    resetSettings,
    changeZoneModel,
    getHRZones,
    getPaceZones,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
