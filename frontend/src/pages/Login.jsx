import { useState } from "react";
import axios from "axios";

const Login = () => {
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/v1/auth/strava/login");
      const { url } = response.data;
      window.location.href = url;
    } catch (err) {
      console.error("Login Error:", err);
      setError("Failed to connect to backend.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Welcome to Talaria</h1>
      <button onClick={handleLogin}>Connect with Strava</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Login;