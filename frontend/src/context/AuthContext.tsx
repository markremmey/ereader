// src/context/AuthContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Define the shape of our auth context state and functions
interface AuthContextType {
  isAuthenticated: boolean;
  isDemoSession: boolean;
  isLoading: boolean;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => void;
  startDemoSession: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

// Create context with default dummy values (to satisfy TypeScript)
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isDemoSession: false,
  isLoading: true,
  loginWithPassword: async () => {},
  logout: () => {},
  startDemoSession: async () => {},
  checkAuthStatus: async () => {}
});

// Hook for easy context consumption
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDemoSession, setIsDemoSession] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check authentication status by calling a backend endpoint
  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include', // Include cookies
      });

      console.log("AuthContext.tsx: checkAuthStatus: res: ", res)
      
      if (res.ok) {
        const userData = await res.json();
        setIsAuthenticated(true);
        // Check if this is a demo session based on the user data
        setIsDemoSession(userData.email === "demo@example.com");
      } else {
        setIsAuthenticated(false);
        setIsDemoSession(false);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      setIsDemoSession(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function: call backend which sets cookie
  const loginWithPassword = async (email: string, password: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/jwt/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      credentials: 'include', // Include cookies
      body: new URLSearchParams({
        username: email,
        password: password
      })
    });

    console.log("AuthContext.tsx: loginWithPassword: res: ", res)
    if (!res.ok) {
      throw new Error('Invalid credentials');
    }
    
    // After successful login, check auth status to update state
    await checkAuthStatus();
  };

  // Start Demo Session function
  const startDemoSession = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/start-demo`, {
        method: 'POST',
        credentials: 'include', // Important: include cookies in the request
      });
      if (!res.ok) {
        let errorDetail = 'Failed to start demo session.';
        try {
            const errorData = await res.json();
            errorDetail = errorData.detail || errorDetail;
        } catch (e) {
            // Keep default error if parsing fails
        }
        throw new Error(errorDetail);
      }
      
      // After demo session starts, update auth state
      setIsAuthenticated(true);
      setIsDemoSession(true);
    } catch (error) {
      console.error("Error starting demo session:", error);
      throw error; 
    }
  };

  // Logout function: call backend to clear cookies
  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsAuthenticated(false);
      setIsDemoSession(false);
      navigate('/login');
    }
  };

  // Check auth status on app load
  React.useEffect(() => {
    checkAuthStatus()
  }, []);

  const value = { 
    isAuthenticated, 
    isDemoSession, 
    isLoading,
    loginWithPassword, 
    logout, 
    startDemoSession,
    checkAuthStatus 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
