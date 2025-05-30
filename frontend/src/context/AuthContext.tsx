// src/context/AuthContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Define the shape of our auth context state and functions
interface AuthContextType {
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create context with default dummy values (to satisfy TypeScript)
const AuthContext = createContext<AuthContextType>({
  token: null,
  login: async () => {},
  logout: () => {}
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
  };

  // Logout function: clear the token
  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const value = { token, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
