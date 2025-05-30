// src/pages/LibraryPage.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Define a TypeScript interface for Book (adjust fields based on actual API)
interface BookBlob {
  id: number;
  name: string
}

const LibraryPage: React.FC = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [bookBlobList, setBookBlobList] = useState<BookBlob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      console.log("LibraryPage.tsx, fetchBooks res: ", res)
      const data = await res.json();
      console.log("LibraryPage.tsx, fetchBooks data: ", data)
      setBookBlobList(data.blob_list);  // assuming data is an array of books

    } catch (err) {
      setError('Could not load books.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // If somehow this page renders without a token, redirect (safety check)
    if (!token) {
      navigate('/login');
      return;
    }
    fetchBooks();
  }, [token, navigate]);

  if (loading) {
    return <p>Loading your library...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="flex flex-col h-screen">
      <h2 className="text-2xl font-bold p-4">Your Library</h2>
      {bookBlobList.length === 0 ? (
        <p>No books found. Upload some books to get started!</p>
      ) : (
        <ul>
          {bookBlobList.map(Blobitem => (
            <li key={Blobitem.id}>
              <strong>{Blobitem.id}</strong> 
              - <Link to={`/reader?blobName=${Blobitem.name}`}>Read Book "{Blobitem.name}"</Link>
            </li>
          ))}
        </ul>
      )}
    <div className="mt-auto flex gap-4">
      <button onClick={logout} className="text-red-500 underline">
        Log Out
      </button>
      <Link to="/login" className="text-blue-500 underline">
        Back to Login
      </Link>
    </div>
    </div>
  );
};

export default LibraryPage;