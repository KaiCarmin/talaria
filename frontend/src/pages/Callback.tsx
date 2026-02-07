import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      // Extract the authorization code from URL
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      // User denied access
      if (errorParam) {
        setError('You denied access to Strava. Please try again.');
        setLoading(false);
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      // No code present
      if (!code) {
        setError('No authorization code received from Strava.');
        setLoading(false);
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      try {
        // Exchange code for tokens
        const response = await axios.post(
          `http://localhost:8000/api/v1/auth/strava/callback?code=${code}`
        );

        // Extract athlete data (backend returns athlete_id, we'll need the full athlete)
        const { athlete_id } = response.data;

        // For now, create a minimal athlete object
        // In a real app, the backend should return full athlete data
        const athleteData = {
          id: athlete_id,
          strava_id: athlete_id,
          firstname: null,
          lastname: null,
          profile_medium: null,
        };

        // Save to auth context
        login(athleteData);

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (err: any) {
        console.error('Callback error:', err);
        setError(
          err.response?.data?.detail || 'Failed to authenticate with Strava. Please try again.'
        );
        setLoading(false);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div style={{ textAlign: 'center', marginTop: '100px', padding: '20px' }}>
      {loading && (
        <>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚡</div>
          <h2>Connecting to Strava...</h2>
          <p>Please wait while we complete the authentication.</p>
        </>
      )}
      {error && (
        <>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h2>Authentication Failed</h2>
          <p style={{ color: 'red' }}>{error}</p>
          <p style={{ color: '#666', marginTop: '10px' }}>Redirecting to login...</p>
        </>
      )}
    </div>
  );
};

export default Callback;
