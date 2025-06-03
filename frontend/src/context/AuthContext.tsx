// src/context/AuthContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Define the shape of our auth context state and functions
interface AuthContextType {
  token: string | null;
  isDemoSession: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  startDemoSession: () => Promise<void>;
}

// Create context with default dummy values (to satisfy TypeScript)
const AuthContext = createContext<AuthContextType>({
  token: null,
  isDemoSession: false,
  login: async () => {},
  logout: () => {},
  startDemoSession: async () => {}
});

// Hook for easy context consumption
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const isDev = import.meta.env.DEV;
  console.log("AuthContext.tsx: isDev: ", isDev)
  const [token, setToken] = useState<string | null>(() => {
    if (isDev) {
      const devToken = 'dev-bypass-token';
      localStorage.setItem('token', devToken);
      return devToken;
    }
    return localStorage.getItem('token');
  });
  const [isDemoSession, setIsDemoSession] = useState<boolean>(false);
  

  // Login function: call backend then store token
  const login = async (username: string, password: string) => {
    // Make API call to FastAPI login endpoint
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      throw new Error('Invalid credentials');
    }
    const data = await res.json();
    // Assuming the response contains the JWT token (e.g., { token: '...'}):
    const jwt = data.token || data.access_token;
    setToken(jwt);
    localStorage.setItem('token', jwt);
    setIsDemoSession(false);
  };

  // Start Demo Session function
  const startDemoSession = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/start-demo`, {
        method: 'POST',
        // No body or content-type needed for this specific endpoint if it doesn't expect one
      });
      if (!res.ok) {
        // Try to get error message from backend if available
        let errorDetail = 'Failed to start demo session.';
        try {
            const errorData = await res.json();
            errorDetail = errorData.detail || errorDetail;
        } catch (e) {
            // Keep default error if parsing fails
        }
        throw new Error(errorDetail);
      }
      // Backend sets an HTTP-only cookie. Frontend signals demo mode.
      setToken("DEMO_SESSION_ACTIVE"); // Placeholder token for frontend state
      setIsDemoSession(true);
      // Do NOT store this placeholder token in localStorage
    } catch (error) {
      console.error("Error starting demo session:", error);
      // Re-throw the error so the calling component (LoginPage) can handle it (e.g., display to user)
      throw error; 
    }
  };

  // Logout function: clear the token and demo state
  const logout = () => {
    setToken(null);
    setIsDemoSession(false);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const value = { token, isDemoSession, login, logout, startDemoSession };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
