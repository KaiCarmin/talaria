import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.get("http://localhost:8000/api/v1/auth/strava/login");
      const { url } = response.data;
      
      // Redirect to Strava
      window.location.href = url;
    } catch (err) {
      console.error("Login Error:", err);
      setError("Failed to connect to backend. Make sure the server is running.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '60px 40px',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Logo/Brand */}
        <div style={{ fontSize: '72px', marginBottom: '20px' }}>⚡</div>
        
        <h1 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '48px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Talaria
        </h1>
        
        <p style={{ 
          color: '#666', 
          fontSize: '18px', 
          marginBottom: '40px',
          lineHeight: '1.6'
        }}>
          Your AI-powered running coach.<br />
          Get insights, track progress, and improve your performance.
        </p>

        {/* Strava Connect Button */}
        <button 
          onClick={handleLogin}
          disabled={loading}
          style={{
            background: '#fc5200',
            color: 'white',
            border: 'none',
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.3s ease',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#e04a00';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(252, 82, 0, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#fc5200';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {loading ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite' }}>⚙️</span>
              Connecting...
            </>
          ) : (
            <>
              <span>🏃</span>
              Connect with Strava
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '6px',
            color: '#c00',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Info Section */}
        <div style={{
          marginTop: '40px',
          paddingTop: '30px',
          borderTop: '1px solid #eee',
          fontSize: '14px',
          color: '#999'
        }}>
          <p style={{ margin: 0 }}>
            By connecting, you allow Talaria to access your Strava activities
          </p>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;