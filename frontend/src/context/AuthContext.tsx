import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Athlete {
  id: number;
  strava_id: number;
  firstname: string | null;
  lastname: string | null;
  profile_medium: string | null;
  created_at?: string;
}

interface AuthContextType {
  athlete: Athlete | null;
  isAuthenticated: boolean;
  login: (athleteData: Athlete) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [athlete, setAthlete] = useState<Athlete | null>(null);

  // Load athlete from localStorage on mount
  useEffect(() => {
    const storedAthlete = localStorage.getItem('athlete');
    if (storedAthlete) {
      try {
        setAthlete(JSON.parse(storedAthlete));
      } catch (error) {
        console.error('Failed to parse stored athlete data:', error);
        localStorage.removeItem('athlete');
      }
    }
  }, []);

  const login = (athleteData: Athlete) => {
    setAthlete(athleteData);
    localStorage.setItem('athlete', JSON.stringify(athleteData));
  };

  const logout = () => {
    setAthlete(null);
    localStorage.removeItem('athlete');
  };

  const isAuthenticated = athlete !== null;

  return (
    <AuthContext.Provider value={{ athlete, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
