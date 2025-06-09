// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { loginWithPassword, startDemoSession } = useAuth();
  const navigate = useNavigate();
  // State for form inputs and error message
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await loginWithPassword(email, password);
      navigate('/library');  // go to library on successful login
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error("Login error:", err);
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
          <label className="block text-gray-700 mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={email}
            onChange={e => setEmail(e.target.value)}
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
