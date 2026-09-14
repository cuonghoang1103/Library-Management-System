import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { booksApi } from '../services/api';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    isbn: '',
    publisher: '',
    genre: '',
    totalCopies: 1,
  });

  useEffect(() => {
    fetchBooks();
  }, [page]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await booksApi.getAll(page, 10);
      setBooks(res.data.data.content || []);
      setTotalPages(res.data.data.totalPages || 0);
    } catch (err) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await booksApi.update(editingBook.id, formData);
        toast.success('Book updated successfully');
      } else {
        await booksApi.create(formData);
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
      genre: book.genre || '',
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
      genre: '',
      totalCopies: 1,
    });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Books</h1>
        <button onClick={() => { resetForm(); setEditingBook(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> Add Book
        </button>
      </div>

      {/* Books Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No books found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Author</th>
                <th className="px-6 py-3">Genre</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Available</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="table-row">
                  <td className="px-6 py-4">
                    <Link to={`/books/${book.id}`} className="text-blue-600 hover:underline font-medium">
                      {book.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{book.author}</td>
                  <td className="px-6 py-4">
                    {book.genre && <span className="badge badge-info">{book.genre}</span>}
                  </td>
                  <td className="px-6 py-4">{book.totalCopies}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {book.availableCopies}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(book)} className="p-2 text-gray-500 hover:text-blue-600">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(book.id)} className="p-2 text-gray-500 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-secondary">Previous</button>
          <span className="px-4 py-2">Page {page + 1} of {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="btn-secondary">Next</button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="label">Author *</label>
                <input type="text" value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input" rows="3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">ISBN</label>
                  <input type="text" value={formData.isbn} onChange={(e) => setFormData({...formData, isbn: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="label">Genre</label>
                  <input type="text" value={formData.genre} onChange={(e) => setFormData({...formData, genre: e.target.value})} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Publisher</label>
                <input type="text" value={formData.publisher} onChange={(e) => setFormData({...formData, publisher: e.target.value})} className="input" />
              </div>
              {!editingBook && (
                <div>
                  <label className="label">Number of Copies</label>
                  <input type="number" min="1" value={formData.totalCopies} onChange={(e) => setFormData({...formData, totalCopies: parseInt(e.target.value)})} className="input" />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingBook ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
