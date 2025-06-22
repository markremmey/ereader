// src/pages/ProfilePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { handleManageSubscription } from '../api/subscription';

const ProfilePage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { data: user, isLoading, error } = useCurrentUser();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleManageSubscriptionClick = async () => {
    setIsLoadingPortal(true);
    try {
      await handleManageSubscription();
    } catch (error) {
      console.error('Failed to open subscription portal:', error);
      alert('Failed to open subscription management. Please try again.');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Failed to load profile</p>
          <button 
            onClick={() => navigate('/library')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <button 
              onClick={() => navigate('/library')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Library
            </button>
          </div>

          <div className="space-y-6">
            {/* User Info Section */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subscription Status</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user.is_subscribed ? (
                      <span className="text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-red-600 font-medium">Inactive</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Account Actions</h2>
              
              {user.is_subscribed && (
                <button
                  onClick={handleManageSubscriptionClick}
                  disabled={isLoadingPortal}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingPortal ? 'Opening...' : 'Manage Subscription'}
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;