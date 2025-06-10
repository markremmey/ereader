// src/pages/LibraryPage.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Define a TypeScript interface for Book (adjust fields based on actual API)
interface BookBlob {
  bookId: string;
  title: string;
  author: string;
  blob_name: string;
  cover_blob_name: string;
  content_type: string;
  cover_blob_url: string;
}

const LibraryPage: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [bookList, setBookList] = useState<BookBlob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch books from API
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/books/`, {
        credentials: 'include',
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
      setBookList(data.book_list);  // assuming data is an array of books
    } catch (err) {
      setError('Could not load books.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // If somehow this page renders without a token, redirect (safety check)
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchBooks();
  }, [isAuthenticated, navigate]);

  if (loading) {
    return <p>Loading your library...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  console.log("LibraryPage.tsx, bookList: cover_blob_url ", bookList[0].cover_blob_url)

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Library</h2>
        <button onClick={logout} className="text-red-500 underline">
          Log Out
        </button>
      </div>
      {bookList.length === 0 ? (
        <p>No books found. Upload some books to get started!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
          {bookList.map(book => (
            <Link key={book.bookId} to={`/reader?blobName=${book.blob_name}&title=${book.title}`} className="block border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img 
                src={book.cover_blob_url} 
                alt={`${book.title} cover`} 
                className="w-full h-48 object-cover" // Adjusted for better image display
              />
              <div className="p-4">
                <h3 className="text-sm font-semibold truncate" title={book.title}>{book.title}</h3>
                <p className="text-sm text-gray-600 truncate" title={book.author}>{book.author}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    <div className="mt-auto pt-4 flex justify-end"> 
      {/* Removed the "Back to Login" link as logout is available */}
    </div>
    </div>
  );
};

export default LibraryPage;