import React, { useState, useEffect } from 'react';
import { ReactReader } from 'react-reader';
import ChatWindow from '../components/ChatWindow';
import { useSearchParams } from 'react-router-dom';
import { FaComments, FaTimes } from 'react-icons/fa'; // Import icons

const ReaderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const blobName = searchParams.get('blobName');
  console.log("ReaderPage.tsx, blobName: ", blobName);
  const [epubData, setEpubData] = useState<ArrayBuffer | string>("");
  const [location, setLocation] = useState<string | number>(
    'epubcfi(/6/2[cover]!/6)'
  );
  const [isChatOpen, setIsChatOpen] = useState(false); // State for chat visibility

  const fetchBlobUrl = async () => {
    try {
      // Get the blob URL from the API
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/books/get_full_blob_url/${blobName}`
      );
      if (!res.ok) throw new Error('Failed to fetch blob URL');
      const url = await res.json();
      console.log("url: ", url);

      // Get the epub data from the blob URL
      const epubRes = await fetch(url);
      console.log("epubRes: ", epubRes);
      if (!epubRes.ok) throw new Error('Failed to fetch epub');
      const epubArrayBuffer = await epubRes.arrayBuffer();
      console.log("epubArrayBuffer: ", epubArrayBuffer);

      setEpubData(epubArrayBuffer);
    } catch (err) {
      console.error(err);
    }
  };
  
  useEffect(() => {
    if (!blobName) return;
    console.log("ReaderPage.tsx, useEffect, fetching blobName: ", blobName);

    fetchBlobUrl();
  }, [blobName]);

  // While we're loading the URL...
  if (!blobName) {
    return <div>Loading book…</div>;
  }

  return (
    <div className="flex h-screen relative">
      {/* Reader View */}
      <div
        className={`h-full transition-all duration-300 ease-in-out ${
          isChatOpen ? 'w-full md:w-2/3' : 'w-full'
        } overflow-hidden`}
      >
        <ReactReader
          url={epubData}
          title={blobName || ''}
          location={location}
          locationChanged={setLocation}
        />
      </div>

      {/* Chat Window - Conditional rendering and styling for mobile/desktop */}
      <div
        className={`
          h-full border-l p-4 transition-all duration-300 ease-in-out
          fixed top-0 right-0 bg-white shadow-lg z-40                   // Mobile: base for overlay (positioning, appearance, AND Z-INDEX)

          ${
            isChatOpen ?
            'w-full opacity-100 translate-x-0 pointer-events-auto' : // Mobile Open State - NOW FULL WIDTH
            'w-0 opacity-0 translate-x-full pointer-events-none'      // Mobile Closed State
          }

          md:relative md:w-1/3 md:opacity-100 md:translate-x-0 md:pointer-events-auto
          md:shadow-none md:bg-transparent
        `}
      >
        <ChatWindow />
      </div>

      {/* Toggle Chat Button - Positioned for mobile, hidden on larger screens if chat is always visible or managed differently */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-20 right-4 z-50 bg-black text-white p-3 rounded-full shadow-lg md:hidden" // Hidden on md and larger screens
        aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
      >
        {isChatOpen ? <FaTimes size={24} /> : <FaComments size={24} />}
      </button>
    </div>
  );
};

export default ReaderPage;
