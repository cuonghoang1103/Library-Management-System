import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { booksApi } from '../services/api';
import { Plus, Edit, Trash2, BookOpen, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import BookCover from '../components/BookCover';

// Skeleton Component
const BookSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
  </div>
);

// Empty State Component
const EmptyState = ({ onAddBook }) => (
  <div className="text-center py-16">
    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
      <BookOpen className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No books yet</h3>
    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
      Start building your library by adding your first book.
    </p>
    <button
      onClick={onAddBook}
      className="btn-primary inline-flex items-center gap-2"
    >
      <Plus size={20} />
      Add Your First Book
    </button>
  </div>
);

export default function Books() {
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    isbn: '',
    publisher: '',
    publishedDate: '',
    genre: '',
    coverImage: '',
    language: 'English',
    pages: '',
    totalCopies: 1,
  });

  useEffect(() => {
    fetchBooks();
  }, [page, genreFilter, sortBy, sortOrder]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await booksApi.getAll(page, 12);
      let booksData = res.data.data.content || [];

      // Client-side filtering
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        booksData = booksData.filter(book =>
          book.title.toLowerCase().includes(term) ||
          book.author.toLowerCase().includes(term) ||
          book.isbn?.toLowerCase().includes(term)
        );
      }

      // Client-side sorting
      booksData.sort((a, b) => {
        let aVal = a[sortBy] || '';
        let bVal = b[sortBy] || '';
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });

      setBooks(booksData);
      setTotalPages(res.data.data.totalPages || 0);
      setTotalElements(res.data.data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchBooks();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        pages: formData.pages ? parseInt(formData.pages) : null,
        publishedDate: formData.publishedDate || null,
      };

      if (editingBook) {
        await booksApi.update(editingBook.id, payload);
        toast.success('Book updated successfully');
      } else {
        await booksApi.create(payload);
        toast.success('Book created successfully');
      }
      setShowModal(false);
      setEditingBook(null);
      resetForm();
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      description: book.description || '',
      isbn: book.isbn || '',
      publisher: book.publisher || '',
      publishedDate: book.publishedDate || '',
      genre: book.genre || '',
      coverImage: book.coverImage || '',
      language: book.language || 'English',
      pages: book.pages || '',
      totalCopies: book.totalCopies || 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
      await booksApi.delete(id);
      toast.success('Book deleted successfully');
      fetchBooks();
    } catch (err) {
      toast.error('Failed to delete book');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      isbn: '',
      publisher: '',
      publishedDate: '',
      genre: '',
      coverImage: '',
      language: 'English',
      pages: '',
      totalCopies: 1,
    });
  };

  // Get unique genres for filter
  const genres = [...new Set(books.map(b => b.genre).filter(Boolean))];

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Books</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalElements > 0 ? `${totalElements} books in library` : 'No books yet'}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingBook(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Book
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by title, author, or ISBN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>
          </div>
          <select
            value={genreFilter}
            onChange={(e) => { setGenreFilter(e.target.value); setPage(0); }}
            className="input w-full md:w-48"
          >
            <option value="">All Genres</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by);
              setSortOrder(order);
            }}
            className="input w-full md:w-48"
          >
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="author-asc">Author A-Z</option>
            <option value="author-desc">Author Z-A</option>
            <option value="publishedDate-desc">Newest First</option>
            <option value="publishedDate-asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <BookSkeleton key={i} />
          ))}
        </div>
      ) : books.length === 0 ? (
        <EmptyState onAddBook={() => { resetForm(); setEditingBook(null); setShowModal(true); }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <div key={book.id} className="card p-0 overflow-hidden group hover:shadow-lg transition-all duration-300">
              {/* Book Cover */}
              <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <BookCover
                  src={book.coverImage}
                  title={book.title}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleEdit(book)}
                    className="p-2 bg-white rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`}>
                    {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Not available'}
                  </span>
                </div>
              </div>

              {/* Book Info */}
              <div className="p-4">
                <Link to={`/books/${book.id}`}>
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {book.title}
                  </h3>
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{book.author}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {book.genre && <span className="badge badge-info">{book.genre}</span>}
                  {book.language && <span className="badge badge-warning">{book.language}</span>}
                </div>
                {book.isbn && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">ISBN: {book.isbn}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingBook ? 'Edit Book' : 'Add New Book'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Author *</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">ISBN</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                    className="input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="label">Publisher</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Published Date</label>
                  <input
                    type="date"
                    value={formData.publishedDate}
                    onChange={(e) => setFormData({...formData, publishedDate: e.target.value})}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Genre</label>
                  <input
                    type="text"
                    value={formData.genre}
                    onChange={(e) => setFormData({...formData, genre: e.target.value})}
                    className="input"
                    list="genre-list"
                    placeholder="e.g., Programming, Fiction, Science"
                  />
                  <datalist id="genre-list">
                    {genres.map(g => <option key={g} value={g} />)}
                  </datalist>
                </div>

                <div>
                  <label className="label">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                    className="input"
                  >
                    <option value="English">English</option>
                    <option value="Vietnamese">Vietnamese</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Korean">Korean</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="label">Pages</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.pages}
                    onChange={(e) => setFormData({...formData, pages: e.target.value})}
                    className="input"
                  />
                </div>

                {!editingBook && (
                  <div>
                    <label className="label">Number of Copies</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalCopies}
                      onChange={(e) => setFormData({...formData, totalCopies: parseInt(e.target.value)})}
                      className="input"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="label">Cover Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.coverImage}
                      onChange={(e) => setFormData({...formData, coverImage: e.target.value})}
                      className="input pl-10"
                      placeholder="https://..."
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use default cover. Try OpenLibrary: covers.openlibrary.org
                  </p>
                  {/* Preview */}
                  {formData.coverImage && (
                    <div className="mt-2 w-24 h-32 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                      <img
                        src={formData.coverImage}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingBook ? 'Update Book' : 'Create Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
