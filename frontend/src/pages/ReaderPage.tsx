import React, { useState, useEffect } from 'react';
import { ReactReader } from 'react-reader';
import ChatWindow from '../components/ChatWindow';
import { useSearchParams } from 'react-router-dom';

const ReaderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const blobName = searchParams.get('blobName');
  console.log("ReaderPage.tsx, blobName: ", blobName);
  const [epubData, setEpubData] = useState<ArrayBuffer | string>("");
  const [location, setLocation] = useState<string | number>(
    'epubcfi(/6/2[cover]!/6)'
  );
  
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

  // While we’re loading the URL...
  if (!blobName) {
    return <div>Loading book…</div>;
  }

  return (
    <div className="flex h-screen">
      <div className="flex-2/3 h-full overflow-hidden">
        <ReactReader
          url={epubData}
          title={blobName || ''}
          location={location}
          locationChanged={setLocation}
        />
      </div>
      <div className="flex-1/3 h-full border-l p-4">
        <ChatWindow />
      </div>
    </div>
  );
};

export default ReaderPage;
