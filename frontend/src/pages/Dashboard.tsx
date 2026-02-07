import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { athlete, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
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
              <li>📊 Activity sync and visualization</li>
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
