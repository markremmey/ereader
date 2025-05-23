import React, { useState, useEffect } from 'react';
import { ReactReader } from 'react-reader';
import ChatWindow from '../components/ChatWindow';
import { useParams } from 'react-router-dom';

const ReaderPage: React.FC = () => {
  const { blobName } = useParams<{ blobName: string }>();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<string | number>(
    'epubcfi(/6/2[cover]!/6)'
  );
  console.log("ReaderPage");
  console.log("blobName: ", blobName);
  console.log('render')
  useEffect(() => {
    console.log("useEffect");
    if (!blobName) return;
    console.log("blobName: ", blobName);
    const fetchBlobUrl = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/books/get_full_blob_url/${blobName}?t=${Date.now()}`
        );
        if (!res.ok) throw new Error('Failed to fetch blob URL');
        const data = await res.json();
        console.log("data: ", data);
        setBlobUrl(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchBlobUrl();
  }, [blobName]);

  // While we’re loading the URL...
  if (!blobUrl) {
    return <div>Loading book…</div>;
  }

  return (
    <div className="flex h-screen">
      <div className="flex-2/3 h-full overflow-hidden">
        <ReactReader
          // url="https://ebookcontent.blob.core.windows.net/defaultlibrary/pg6130-images-3.epub?sp=r&st=2025-05-22T01:17:42Z&se=2025-05-22T09:17:42Z&spr=https&sv=2024-11-04&sr=b&sig=rinUD0%2B07m1FF67BJwaqo8jZchSxI89dXkz7R6kU23U%3D"
          url={blobUrl}
          title={blobName}
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
