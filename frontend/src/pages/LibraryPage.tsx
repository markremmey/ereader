// src/pages/LibraryPage.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Define a TypeScript interface for Book (adjust fields based on actual API)
interface Book {
  id: number;
  title: string;
  author?: string;
  // any other fields like cover image, etc.
}

const LibraryPage: React.FC = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    // If somehow this page renders without a token, redirect (safety check)
    if (!token) {
      navigate('/login');
      return;
    }
    // Fetch books from API
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/books`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
          navigate('/login');
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to fetch books');
        }
        const data = await res.json();
        setBooks(data);  // assuming data is an array of books
      } catch (err) {
        setError('Could not load books.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [token, navigate]);

  if (loading) {
    return <p>Loading your library...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  // const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;
  //   setUploading(true);
  //   try {
  //     const formData = new FormData();
  //     formData.append('file', file);
  //     const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/books/upload`, {
  //       method: 'POST',
  //       headers: { 'Authorization': `Bearer ${token}` },
  //       body: formData
  //     });
  //     if (!res.ok) {
  //       throw new Error('Failed to upload book');
  //     }
  //     const data = await res.json();
  //     setBooks(prev => [...prev, data]);
  //   } catch (err) {
  //     setError('Could not upload book.');
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  return (
    <div className="library-page">
      <h2>Your Library</h2>
      {/* <input 
        type="file" 
        accept=".pdf, .epub" 
        onChange={handleFileChange} 
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {error && <p>{error}</p>} */}
      {books.length === 0 ? (
        <p>No books found. Upload some books to get started!</p>
      ) : (
        <ul>
          {books.map(book => (
            <li key={book.id}>
              <strong>{book.title}</strong>{book.author ? ` by ${book.author}` : ''} 
              – <Link to={`/reader/${book.id}`}>Read</Link>
            </li>
          ))}
        </ul>
      )}
      <button onClick={logout}>Log Out</button>
    </div>
  );
};

export default LibraryPage;
