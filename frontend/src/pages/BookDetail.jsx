import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booksApi } from '../services/api';
import { ArrowLeft, Plus, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  if (!book) return null;

  return (
    <div className="p-8">
      <button onClick={() => navigate('/books')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft size={20} /> Back to Books
      </button>

      {/* Book Info */}
      <div className="card mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
            <p className="text-xl text-gray-600 mb-4">by {book.author}</p>
            <div className="flex gap-4 text-sm text-gray-500">
              {book.genre && <span className="badge badge-info">{book.genre}</span>}
              {book.isbn && <span>ISBN: {book.isbn}</span>}
              {book.publisher && <span>{book.publisher}</span>}
              {book.publishedDate && <span>Published: {new Date(book.publishedDate).getFullYear()}</span>}
            </div>
            {book.description && <p className="mt-4 text-gray-700">{book.description}</p>}
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600">{book.availableCopies}</div>
            <div className="text-gray-500">/ {book.totalCopies} copies</div>
          </div>
        </div>
      </div>

      {/* Copies */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Book Copies</h2>
          <button onClick={() => setShowAddCopy(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> Add Copy
          </button>
        </div>

        {copies.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No copies available</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Copy Number</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {copies.map((copy) => (
                <tr key={copy.id} className="table-row">
                  <td className="px-6 py-4 font-medium">{copy.copyNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${
                      copy.status === 'ON_SHELF' ? 'badge-success' :
                      copy.status === 'LOANED' ? 'badge-warning' :
                      copy.status === 'LOST' ? 'badge-danger' : 'badge-info'
                    }`}>{copy.status}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{copy.location || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{copy.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Copy Modal */}
      {showAddCopy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Book Copy</h2>
            <form onSubmit={handleAddCopy} className="space-y-4">
              <div>
                <label className="label">Copy Number *</label>
                <input type="text" value={copyData.copyNumber} onChange={(e) => setCopyData({...copyData, copyNumber: e.target.value})} className="input" placeholder="e.g., BK-1-3" required />
              </div>
              <div>
                <label className="label">Location</label>
                <input type="text" value={copyData.location} onChange={(e) => setCopyData({...copyData, location: e.target.value})} className="input" placeholder="e.g., A-12-3" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea value={copyData.notes} onChange={(e) => setCopyData({...copyData, notes: e.target.value})} className="input" rows="2" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowAddCopy(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Copy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
