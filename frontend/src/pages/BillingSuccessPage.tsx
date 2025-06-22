import React from 'react'
import { useNavigate } from 'react-router-dom';
const BillingSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Billing Success</h1>
      <button
          onClick={() => navigate('/library')}
          className="w-full py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          Go to Library
    </button>
  </div>
  )
}

export default BillingSuccessPage