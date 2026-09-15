import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booksApi, loansApi, reservationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, BookOpen, MapPin, Calendar, Hash, Globe, FileText, AlertCircle, Clock, CheckCircle, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import BookCover from '../components/BookCover';
import ReviewSection from '../components/ReviewSection';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLibrarian } = useAuth();
  const [book, setBook] = useState(null);
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [showAddCopy, setShowAddCopy] = useState(false);
  const [copyData, setCopyData] = useState({ copyNumber: '', location: '', notes: '' });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookRes, copiesRes] = await Promise.all([
        booksApi.getById(id),
        booksApi.getCopies(id),
      ]);
      setBook(bookRes.data.data);
      setCopies(copiesRes.data.data);
    } catch (err) {
      toast.error('Failed to load book details');
      navigate('/books');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCopy = async (e) => {
    e.preventDefault();
    try {
      await booksApi.addCopy(id, copyData);
      toast.success('Copy added successfully');
      setShowAddCopy(false);
      setCopyData({ copyNumber: '', location: '', notes: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add copy');
    }
  };

  // Self-service borrowing - for members
  const handleBorrowBook = async (copyId) => {
    setBorrowing(copyId);
    try {
      await loansApi.borrow(copyId);
      toast.success('Book borrowed successfully! Check your loans.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to borrow book');
    } finally {
      setBorrowing(false);
    }
  };

  // Reserve a book - for members when book is not available
  const handleReserveBook = async () => {
    setReserving(true);
    try {
      await reservationsApi.create(id);
      toast.success('Book reserved successfully! We\'ll notify you when it\'s available.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reserve book');
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!book) return null;

  const availableCopies = copies.filter(c => c.status === 'ON_SHELF');

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/search')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Search
      </button>

      {/* Book Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Book Cover */}
          <div className="lg:w-80 p-6 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
            <div className="w-full max-w-[240px] aspect-[3/4] bg-gray-200 dark:bg-gray-600 rounded-xl overflow-hidden shadow-lg">
              <BookCover src={book.coverImage} title={book.title} className="w-full h-full" />
            </div>
          </div>

          {/* Book Info */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{book.title}</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">by {book.author}</p>
              </div>
              
              {/* Availability Badge */}
              <div className={`flex-shrink-0 text-center px-4 py-3 rounded-xl ${
                book.availableCopies > 0
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <div className={`text-3xl font-bold ${
                  book.availableCopies > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {book.availableCopies}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Available</div>
              </div>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {book.genre && <span className="badge badge-info">{book.genre}</span>}
              {book.language && <span className="badge badge-warning">{book.language}</span>}
              {book.pages && <span className="badge bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{book.pages} pages</span>}
              {book.totalCopies > 0 && (
                <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {book.totalCopies} copies
                </span>
              )}
            </div>

            {/* Description */}
            {book.description && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Description</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{book.description}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              {book.isbn && (
                <div className="flex items-center gap-2">
                  <Hash size={16} className="text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ISBN</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{book.isbn}</div>
                  </div>
                </div>
              )}
              {book.publisher && (
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Publisher</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{book.publisher}</div>
                  </div>
                </div>
              )}
              {book.publishedDate && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Published</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(book.publishedDate).getFullYear()}
                    </div>
                  </div>
                </div>
              )}
              {book.language && (
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Language</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{book.language}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {availableCopies.length} on shelf
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {copies.filter(c => c.status === 'LOANED').length} on loan
                </span>
              </div>
            </div>

            {/* Self-Service Actions for Members */}
            {!isLibrarian() && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                {book.availableCopies > 0 ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-500" />
                        This book is available!
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Ready to borrow? Select an available copy below.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertCircle size={18} className="text-amber-500" />
                        Currently unavailable
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        All copies are on loan. Reserve this book to be notified when available.
                      </p>
                    </div>
                    <button
                      onClick={handleReserveBook}
                      disabled={reserving}
                      className="btn-primary flex items-center gap-2"
                    >
                      {reserving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Reserving...
                        </>
                      ) : (
                        <>
                          <Bell size={18} />
                          Reserve Book
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copies Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Book Copies ({copies.length})
          </h2>
          {isLibrarian() && (
            <button
              onClick={() => setShowAddCopy(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Add Copy
            </button>
          )}
        </div>

        {copies.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No copies in the library</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3">Copy #</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Notes</th>
                  {!isLibrarian() && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {copies.map((copy) => (
                  <tr key={copy.id} className="table-row">
                    <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{copy.copyNumber}</td>
                    <td className="px-4 py-4">
                      <span className={`badge ${
                        copy.status === 'ON_SHELF' ? 'badge-success' :
                        copy.status === 'LOANED' ? 'badge-warning' :
                        copy.status === 'LOST' ? 'badge-danger' :
                        'badge-info'
                      }`}>
                        {copy.status === 'ON_SHELF' && <CheckCircle size={12} className="mr-1" />}
                        {copy.status === 'ON_SHELF' ? 'Available' : copy.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <MapPin size={14} />
                        {copy.location || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {copy.notes || '-'}
                    </td>
                    {!isLibrarian() && (
                      <td className="px-4 py-4">
                        {copy.status === 'ON_SHELF' ? (
                          <button
                            onClick={() => handleBorrowBook(copy.id)}
                            disabled={borrowing === copy.id}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 flex items-center gap-1"
                          >
                            {borrowing === copy.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                Borrowing...
                              </>
                            ) : (
                              <>
                                <BookOpen size={14} />
                                Borrow
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">On loan</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
 </tbody>
 </table>
 </div>
 )}

 {/* Reviews Section */}
 <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
 <ReviewSection bookId={id} currentUser={user} />
 </div>

 {/* Add Copy Modal */}
      {showAddCopy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Add Book Copy</h2>
            <form onSubmit={handleAddCopy} className="space-y-4">
              <div>
                <label className="label">Copy Number *</label>
                <input
                  type="text"
                  value={copyData.copyNumber}
                  onChange={(e) => setCopyData({...copyData, copyNumber: e.target.value})}
                  className="input"
                  placeholder="e.g., BK-1-3"
                  required
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  value={copyData.location}
                  onChange={(e) => setCopyData({...copyData, location: e.target.value})}
                  className="input"
                  placeholder="e.g., A-12-3"
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={copyData.notes}
                  onChange={(e) => setCopyData({...copyData, notes: e.target.value})}
                  className="input"
                  rows="2"
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setShowAddCopy(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Copy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
</div>  );
}
