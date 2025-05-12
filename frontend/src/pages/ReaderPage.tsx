// src/pages/ReaderPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// (If using react-reader for EPUB)
import { ReactReader } from 'react-reader';  // install with `yarn add react-reader`

const ReaderPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { token } = useAuth();
  const [bookFormat, setBookFormat] = useState<'pdf' | 'epub' | null>(null);
  const [bookTitle, setBookTitle] = useState<string>(''); 
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [epubLocation, setEpubLocation] = useState<string | number>(0);

  useEffect(() => {
    // Fetch book metadata to determine format, and get a file URL if needed
    const fetchBook = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/books/${bookId}/file`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const book = await res.json();
        setBookTitle(book.title || ''); 
        // Assuming `book.format` tells us "pdf" or "epub", or maybe the file name extension:
        if (book.format) {
          setBookFormat(book.format);
        } else if (book.filename) {
          const ext = book.filename.split('.').pop().toLowerCase();
          setBookFormat(ext === 'pdf' ? 'pdf' : 'epub');
        }
        // If API gives a direct URL for the file (perhaps with a token query param or so):
        if (book.fileUrl) {
          setPdfUrl(book.fileUrl);
        }
      }
    };
    fetchBook();
  }, [bookId, token]);

  if (!bookId) {
    return <p>Book ID not found.</p>;
  }

  return (
    <div className="reader-page">
      <h2>Reading: {bookTitle}</h2>
      {bookFormat === 'pdf' && (
        <div>
          {/* PDF viewer: using embed/iframe */}
          {pdfUrl ? (
            <iframe 
              src={pdfUrl} 
              title={bookTitle} 
              width="100%" 
              height="600px"
            />
          ) : (
            // Fallback if we need to fetch the PDF blob and create an object URL
            <p>Loading PDF...</p>
          )}
        </div>
      )}
      {bookFormat === 'epub' && (
        <div style={{ height: '80vh' }}>
          <ReactReader
            title={bookTitle}
            url={`${import.meta.env.VITE_API_BASE_URL}/books/${bookId}/download`} 
            // ^ assuming this endpoint serves the .epub file with proper CORS
            location={epubLocation}
            locationChanged={loc => setEpubLocation(loc)}
          />
        </div>
      )}
      {bookFormat == null && (
        <p>Loading book...</p>
      )}
      <p><Link to="/library">Back to Library</Link></p>
    </div>
  );
};

export default ReaderPage;
