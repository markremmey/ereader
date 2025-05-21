// src/pages/ReaderPage.tsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DOMPurify from 'dompurify';

const ReaderPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>()
  const [chapters, setChapters] = useState<string[]>([]);
  const { token } = useAuth();
  const [ currentIdx, setCurrentIdx ] = useState(0)
  const [html, setHtml] = useState<string>("")
  console.log("bookId", bookId )

  // 1) load chapter list
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/books/${bookId}/chapters`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setChapters(data.chapters))
      .catch(console.error);
  }, [bookId, token]);

  // 2) load the HTML for the current chapter
  useEffect(() => {
    if (chapters.length === 0) return;
    
    const fetchAndSanitize = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/books/${bookId}/chapters/${currentIdx}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const html = await res.text()


        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const bodyInner = doc.body.innerHTML
        
        const clean = DOMPurify.sanitize(bodyInner, {
          USE_PROFILES: { html: true },
        })
        setHtml(clean)
      } catch (error) {
        console.error(error)
      }
    }
    fetchAndSanitize();
  }, [bookId, token, chapters, currentIdx]);

  return (
    <div>
      <p><Link to="/library">Return to library</Link></p>
      <h2>Reader Chapter {currentIdx +1} of {chapters.length }</h2>
      <nav>
        <button
          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >
          ← Prev
        </button>
        <button
          onClick={() => setCurrentIdx(i => Math.min(chapters.length - 1, i + 1))}
          disabled={currentIdx === chapters.length - 1}
        >
          Next →
        </button>
      </nav>
      <div
        className="chapter-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default ReaderPage