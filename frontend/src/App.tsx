import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LibraryPage from './pages/LibraryPage';
import ReaderPage from './pages/ReaderPage';

function App() {
  const { token } = useAuth();  // get auth state

  return (
    <Routes>
      {/* Redirect root to either Library (if logged in) or Login */}
      <Route path="/" element={
        token ? <Navigate to="/library" replace /> : <Navigate to="/login" replace />
      }/>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* Protected routes */}
      <Route path="/library" element={
        token ? <LibraryPage /> : <Navigate to="/login" replace />
      }/>
      <Route path="/reader" element={
        token ? <ReaderPage /> : <Navigate to="/login" replace />
      }/>
    </Routes>
  );
}

export default App;
