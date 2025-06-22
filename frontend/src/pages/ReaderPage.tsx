import React, { useState, useEffect } from 'react';
import { ReactReader } from 'react-reader';
import ChatWindow from '../components/chat/ChatWindow';
import { useSearchParams } from 'react-router-dom';
import { FaComments, FaTimes } from 'react-icons/fa'; // Import icons
import { useEpub } from '../hooks/useEpub';

const ReaderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const blobName = searchParams.get('blobName');
  const title = searchParams.get('title');

  const { data: epubData, isLoading, error } = useEpub(blobName);
  
  const [location, setLocation] = useState<string | number>(() => {
    const saved = localStorage.getItem(`location-${blobName}`);
    return saved ? saved : 'epubcfi(/6/2[cover]!/6)';
  });
  const [isChatOpen, setIsChatOpen] = useState(false); // State for chat visibility

  // Save the location to local storage
  useEffect(() => {
    localStorage.setItem(`location-${blobName}`, location.toString());
  }, [blobName, location]);

  if (!blobName || isLoading) return <div>Loading book…</div>;
  if (error)    return <div>Error loading book</div>;

  return (
    <div className="flex h-screen relative">
      {/* Reader View */}
      <div
        className={`h-full transition-all duration-300 ease-in-out ${
          isChatOpen ? 'w-full md:w-2/3' : 'w-full'
        } overflow-hidden`}
      >
        <ReactReader
          url={epubData!}
          title={title || ''}
          location={location}
          locationChanged={setLocation}
        />
      </div>

      {/* Chat Window - Conditional rendering and styling for mobile/desktop */}
      <div
        className={`
          h-full border-l p-4 transition-all duration-300 ease-in-out
          fixed top-0 right-0 bg-white shadow-lg z-40

          ${
            isChatOpen ?
            'w-full opacity-100 translate-x-0 pointer-events-auto' :
            'w-0 opacity-0 translate-x-full pointer-events-none'
          }

          md:relative md:w-1/3 md:opacity-100 md:translate-x-0 md:pointer-events-auto
          md:shadow-none md:bg-transparent
        `}
      >
        <ChatWindow />
      </div>

      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-20 right-4 z-50 bg-black text-white p-3 rounded-full shadow-lg md:hidden"
        aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
      >
        {isChatOpen ? <FaTimes size={24} /> : <FaComments size={24} />}
      </button>
    </div>
  );
};

export default ReaderPage;
