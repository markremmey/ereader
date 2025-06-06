// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login, startDemoSession } = useAuth();
  const navigate = useNavigate();
  // State for form inputs and error message
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
      navigate('/library');  // go to library on successful login
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
    // Redirect to the backend endpoint that starts the Google OAuth flow
    // The backend will then redirect to Google's authentication page.
    // Ensure VITE_API_BASE_URL is correctly set in your .env file (e.g., http://localhost:8000)\
      const authorizationUrl = `${import.meta.env.VITE_API_BASE_URL}/auth/google/authorize`;
      console.log("Authorization URL: ", authorizationUrl);
      const res = await fetch(authorizationUrl);
      if (!res.ok) {
        console.error("Failed response:", res);
        throw new Error("Could not fetch the Google authorization URL from the backend.");
      }

      // 2. Extract the actual Google URL from the JSON response
      const data = await res.json();
      const googleRedirectUrl = data.authorization_url;
      if (typeof googleRedirectUrl !== 'string') {
        throw new Error("Authorization URL not found or invalid in the response from the backend.");
      }

      // 3. Redirect the user to Google's login page
      window.location.href = googleRedirectUrl;
    } catch (err) {
      setError('Google login failed. Please try again later.');
      console.error("Google login error:", err); // Log for debugging
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    try {
      // Ensure startDemoSession is available from AuthContext
      if (!startDemoSession) {
        console.error("startDemoSession is not available on AuthContext. Ensure it is implemented.");
        setError("Demo feature not available yet. Context not updated.");
        return;
      }
      await startDemoSession(); // This function will call the backend and update context
      navigate('/library'); 
    } catch (err) {
      setError('Demo login failed. Please try again later.');
      console.error("Demo login error:", err); // Log for debugging
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-md p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-center text-gray-800">
            Lyceum AI
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
        )}

        <div>
          <label className="block text-gray-700 mb-1" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          Log In
        </button>
      </form>
      <div className="mt-4 text-center space-y-3">
        <button
          onClick={handleGoogleLogin}
          className="w-full py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition mb-3"
        >
          Sign in with Google
        </button>
        <button
          onClick={handleDemoLogin}
          className="w-full py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
        >
          Try Demo
        </button>
        <p className="text-gray-600 text-sm">
          New user?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
};

export default LoginPage;
