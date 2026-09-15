import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { booksApi } from '../services/api';
import { Plus, Edit, Trash2, BookOpen, Image as ImageIcon, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import BookCover from '../components/BookCover';

const BookSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
  </div>
);

const EmptyState = ({ onAddBook, t }) => (
  <div className="text-center py-16">
    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
      <BookOpen className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('books.noBooks')}</h3>
    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
      {t('books.noBooks')}
    </p>
    <button
      onClick={onAddBook}
      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all inline-flex items-center gap-2"
    >
      <Plus size={20} />
      {t('books.addBook')}
    </button>
  </div>
);

export default function Books() {
  const { t } = useTranslation();
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

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        booksData = booksData.filter(book =>
          book.title.toLowerCase().includes(term) ||
          book.author.toLowerCase().includes(term) ||
          book.isbn?.toLowerCase().includes(term)
        );
      }

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
      toast.error(t('errors.serverError'));
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
        toast.success(t('common.success'));
      } else {
        await booksApi.create(payload);
        toast.success(t('common.success'));
      }
      setShowModal(false);
      setEditingBook(null);
      resetForm();
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || t('errors.serverError'));
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
    if (!window.confirm(t('books.deleteConfirm'))) return;
    try {
      await booksApi.delete(id);
      toast.success(t('common.success'));
      fetchBooks();
    } catch (err) {
      toast.error(t('errors.serverError'));
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

  const genres = [...new Set(books.map(b => b.genre).filter(Boolean))];

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.books')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalElements > 0 ? `${totalElements} ${t('books.title').toLowerCase()}` : t('common.noData')}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingBook(null); setShowModal(true); }}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all inline-flex items-center gap-2"
        >
          <Plus size={20} />
          {t('books.addBook')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('books.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </form>
          </div>
          <select
            value={genreFilter}
            onChange={(e) => { setGenreFilter(e.target.value); setPage(0); }}
            className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('common.filter')}</option>
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
            className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="title-asc">A-Z</option>
            <option value="title-desc">Z-A</option>
            <option value="author-asc">{t('books.author')} A-Z</option>
            <option value="publishedDate-desc">{t('books.publishedDate')} ↓</option>
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
        <EmptyState onAddBook={() => { resetForm(); setEditingBook(null); setShowModal(true); }} t={t} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <div key={book.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <BookCover
                  src={book.coverImage}
                  title={book.title}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleEdit(book)}
                    className="p-3 bg-white rounded-xl text-blue-600 hover:bg-blue-50 transition-colors shadow-lg"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="p-3 bg-white rounded-xl text-red-600 hover:bg-red-50 transition-colors shadow-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                    book.availableCopies > 0
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {book.availableCopies > 0 ? `${book.availableCopies} ${t('books.available')}` : t('books.borrowed')}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <Link to={`/books/${book.id}`}>
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {book.title}
                  </h3>
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{book.author}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {book.genre && (
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {book.genre}
                    </span>
                  )}
                  {book.language && (
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {book.language}
                    </span>
                  )}
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
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.previous')}
          </button>
          <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
            {t('common.page')} {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.next')}
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingBook ? t('books.editBook') : t('books.addBook')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('books.title')} *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('books.author')} *
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('books.isbn')}
                  </label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('common.description')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('books.publisher')}
                  </label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('books.publishedDate')}
                  </label>
                  <input
                    type="date"
                    value={formData.publishedDate}
                    onChange={(e) => setFormData({...formData, publishedDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('books.genre')}
                  </label>
                  <input
                    type="text"
                    value={formData.genre}
                    onChange={(e) => setFormData({...formData, genre: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                    list="genre-list"
                  />
                  <datalist id="genre-list">
                    {genres.map(g => <option key={g} value={g} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('common.language')}
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pages
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.pages}
                    onChange={(e) => setFormData({...formData, pages: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>

                {!editingBook && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('books.copies')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalCopies}
                      onChange={(e) => setFormData({...formData, totalCopies: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('books.cover')} URL
                  </label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.coverImage}
                      onChange={(e) => setFormData({...formData, coverImage: e.target.value})}
                      className="w-full px-4 py-3 pl-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                      placeholder="https://..."
                    />
                  </div>
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
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all"
                >
                  {editingBook ? t('common.save') : t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
