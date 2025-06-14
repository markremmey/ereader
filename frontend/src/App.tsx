import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LibraryPage from './pages/LibraryPage';
import ReaderPage from './pages/ReaderPage';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  
  console.log("🚀 App render - isAuthenticated:", isAuthenticated, "isLoading:", isLoading);
  // Show loading spinner while checking authentication
  if (isLoading) {
    console.log("⏳ Showing loading spinner");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Redirect root to either Library (if authenticated) or Login */}
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/library" replace /> : <Navigate to="/login" replace />
      }/>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* Protected routes */}
      <Route path="/library" element={
        isAuthenticated ? <LibraryPage /> : <Navigate to="/login" replace />
      }/>
      <Route path="/reader" element={
        isAuthenticated ? <ReaderPage /> : <Navigate to="/login" replace />
      }/>
    </Routes>
  );
}

export default App;
