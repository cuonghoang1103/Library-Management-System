import { useState, useEffect } from 'react';
import { loansApi, booksApi, usersApi } from '../services/api';
import { Plus, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ userId: '', copyId: '', dueDate: '' });

  useEffect(() => {
    fetchLoans();
  }, [page]);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await loansApi.getAll(page, 10);
      setLoans(res.data.data.content || []);
      setTotalPages(res.data.data.totalPages || 0);
    } catch (err) {
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    try {
      await loansApi.create(formData);
      toast.success('Loan created successfully');
      setShowModal(false);
      setFormData({ userId: '', copyId: '', dueDate: '' });
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create loan');
    }
  };

  const handleReturn = async (loanId) => {
    try {
      await loansApi.return(loanId);
      toast.success('Book returned successfully');
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to return book');
    }
  };

  const openCreateModal = async () => {
    try {
      const [booksRes, usersRes] = await Promise.all([
        booksApi.getAll(0, 100),
        usersApi.getAll(0, 100),
      ]);
      setBooks(booksRes.data.data.content || []);
      setUsers((usersRes.data.data.content || []).filter(u => u.role === 'MEMBER'));
      setShowModal(true);
    } catch (err) {
      toast.error('Failed to load data');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Loans</h1>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> New Loan
        </button>
      </div>

      {/* Loans Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No loans found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Book</th>
                <th className="px-6 py-3">Member</th>
                <th className="px-6 py-3">Borrowed</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id} className="table-row">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{loan.bookTitle}</p>
                    <p className="text-sm text-gray-500">{loan.copyNumber}</p>
                  </td>
                  <td className="px-6 py-4">{loan.userName}</td>
                  <td className="px-6 py-4">{new Date(loan.borrowedDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{new Date(loan.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${
                      loan.status === 'OVERDUE' ? 'badge-danger' :
                      loan.status === 'RETURNED' ? 'badge-info' :
                      loan.status === 'CLOSED' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {loan.status}
                    </span>
                    {loan.daysOverdue > 0 && <span className="block text-xs text-red-600 mt-1">{loan.daysOverdue} days overdue</span>}
                  </td>
                  <td className="px-6 py-4">
                    {loan.status === 'ACTIVE' || loan.status === 'OVERDUE' ? (
                      <button onClick={() => handleReturn(loan.id)} className="btn-primary text-sm py-1">Return</button>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
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

      {/* Create Loan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Loan</h2>
            <form onSubmit={handleCreateLoan} className="space-y-4">
              <div>
                <label className="label">Member *</label>
                <select value={formData.userId} onChange={(e) => setFormData({...formData, userId: e.target.value})} className="input" required>
                  <option value="">Select member</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.username})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="input" />
              </div>
              <p className="text-sm text-gray-500">Note: To complete loan creation, go to Books and select an available copy to lend.</p>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Loan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
