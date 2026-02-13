import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Dashboard = () => {
  const { athlete, logout } = useAuth();
  const navigate = useNavigate();
  
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '2px solid #fc5200',
        paddingBottom: '20px',
        marginBottom: '40px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '36px' }}>⚡ Talaria</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>AI Running Coach</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {athlete?.profile_medium && (
            <img 
              src={athlete.profile_medium} 
              alt="Profile" 
              style={{ width: '48px', height: '48px', borderRadius: '50%' }}
            />
          )}
          <div>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              {athlete?.firstname} {athlete?.lastname}
            </p>
            <button 
              onClick={handleLogout}
              style={{
                marginTop: '5px',
                padding: '5px 15px',
                fontSize: '12px',
                cursor: 'pointer',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: 'white'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Sync Button Section */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, fontSize: '24px' }}>Sync Activities</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Fetch your latest activities from Strava and store them for analysis.
          </p>
          
          <button
            onClick={handleSync}
            disabled={isSyncing}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              background: isSyncing ? '#ccc' : '#fc5200',
              border: 'none',
              borderRadius: '4px',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s',
            }}
            onMouseEnter={(e) => {
              if (!isSyncing) {
                e.currentTarget.style.background = '#e64a00';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSyncing) {
                e.currentTarget.style.background = '#fc5200';
              }
            }}
          >
            {isSyncing ? '⏳ Syncing...' : '🔄 Sync Activities from Strava'}
          </button>

          {/* Sync Status Messages */}
          {syncStatus.type && (
            <div
              style={{
                marginTop: '20px',
                padding: '15px',
                borderRadius: '4px',
                background: syncStatus.type === 'success' ? '#d4edda' : '#f8d7da',
                border: `1px solid ${syncStatus.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                color: syncStatus.type === 'success' ? '#155724' : '#721c24',
              }}
            >
              <strong>{syncStatus.type === 'success' ? '✅ Success!' : '❌ Error'}</strong>
              <p style={{ margin: '5px 0 0 0' }}>{syncStatus.message}</p>
              
              {syncData && (
                <div style={{ marginTop: '10px', fontSize: '14px' }}>
                  <p style={{ margin: '5px 0' }}>
                    📥 New activities: <strong>{syncData.activities_synced}</strong>
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    🔄 Updated activities: <strong>{syncData.activities_updated}</strong>
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    📊 Total processed: <strong>{syncData.total}</strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Coming Soon Section */}
        <div style={{
          background: '#f5f5f5',
          padding: '60px 40px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>Welcome to Your Dashboard! 🎉</h2>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
            You're successfully authenticated with Strava.
          </p>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'left'
          }}>
            <h3 style={{ marginTop: 0 }}>Coming Soon:</h3>
            <ul style={{ lineHeight: '2', color: '#555' }}>
              <li>📊 Activity list and visualization</li>
              <li>📈 Performance charts and analytics</li>
              <li>🗺️ Route maps with Leaflet</li>
              <li>🤖 AI-powered coaching insights</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
