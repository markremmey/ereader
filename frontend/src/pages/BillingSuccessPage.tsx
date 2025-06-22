import React from 'react'
import { useNavigate } from 'react-router-dom';

const BillingSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Payment Successful!
          </h2>
          <p className="text-gray-600 text-sm">
            Your subscription has been activated. You now have access to all features.
          </p>
        </div>
        
        <button
          onClick={() => navigate('/library')}
          className="w-full py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          Go to Library
        </button>
      </div>
    </div>
  )
}

export default BillingSuccessPage