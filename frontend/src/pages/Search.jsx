import { useState } from 'react';
import { Link } from 'react-router-dom';
import { booksApi } from '../services/api';
import { Search as SearchIcon, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await booksApi.search(query.trim());
      setResults(res.data.data.content || []);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Search Books</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, or keywords..."
              className="input pl-12 py-4 text-lg"
            />
            <button type="submit" className="btn-primary absolute right-2 top-1/2 -translate-y-1/2 py-2 px-6">
              Search
            </button>
          </div>
        </form>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <div>
            <p className="text-gray-500 mb-4">{results.length} results found</p>
            
            {results.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No books found matching your search</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((book) => (
                  <Link key={book.id} to={`/books/${book.id}`} className="card block hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{book.title}</h3>
                        <p className="text-gray-600">{book.author}</p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          {book.genre && <span>{book.genre}</span>}
                          {book.isbn && <span>ISBN: {book.isbn}</span>}
                          {book.publisher && <span>{book.publisher}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`}>
                          {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Not available'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!loading && !hasSearched && (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Search for books by title, author, or keywords</p>
          </div>
        )}
      </div>
    </div>
  );
}
