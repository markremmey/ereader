import React, { useState } from 'react';
import { ReactReader } from 'react-reader';
import ChatWindow from '../components/ChatWindow';


const ReaderPage = () => {
  const [location, setLocation] = useState<string | number>('epubcfi(/6/2[cover]!/6)'); // Starting location

  return (
    <div className="flex h-screen">
      <div className="w-300 h-full overflow-hidden">
        <ReactReader 
          url="/src/test-epub/pg18569-images-3.epub" 
          title="My ePub Book" 
          location={location}
          locationChanged={setLocation}
        />
      </div>

      <div className="w-300 h-full border-l p-4">
        <ChatWindow />
      </div>
    </div>
  );
};

export default ReaderPage;
