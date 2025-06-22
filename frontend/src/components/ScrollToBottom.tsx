import React from 'react';

interface Props {
  onClick: () => void;
}

const ScrollToBottom: React.FC<Props> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="
      absolute -top-8 left-1/2 transform -translate-x-1/2
      bg-black text-white p-2 rounded-full shadow-lg hover:bg-gray-800 z-10
    "
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 rotate-[90deg]">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
    </svg>
  </button>
);

export default ScrollToBottom;
