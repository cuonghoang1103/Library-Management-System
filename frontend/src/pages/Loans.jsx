import { useState, useEffect } from 'react';
import { loansApi, usersApi } from '../services/api';
import { Plus, BookOpen, RefreshCw, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

// Skeleton
const LoanSkeleton = () => (
  <tr className="border-b border-gray-100 dark:border-gray-700">
    <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div></td>
    <td className="px-4 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse"></div></td>
  </tr>
);

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLoans();
  }, [page, statusFilter]);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await loansApi.getAll(page, 20);
      let loansData = res.data.data.content || [];

      // Filter by status
      if (statusFilter !== 'ALL') {
        loansData = loansData.filter(l => l.status === statusFilter);
      }

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        loansData = loansData.filter(l =>
          l.bookTitle?.toLowerCase().includes(term) ||
          l.userName?.toLowerCase().includes(term) ||
          l.copyNumber?.toLowerCase().includes(term)
        );
      }

      setLoans(loansData);
      setTotalPages(res.data.data.totalPages || 0);
      setTotalElements(res.data.data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
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

  const handleRenew = async (loanId) => {
    try {
      await loansApi.renew(loanId);
      toast.success('Loan renewed successfully');
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to renew loan');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <Clock size={14} className="mr-1" />;
      case 'OVERDUE': return <AlertTriangle size={14} className="mr-1" />;
      case 'RETURNED': return <CheckCircle size={14} className="mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Loans</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalElements > 0 ? `${totalElements} total loans` : 'No loans found'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by book, member, or copy number..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              className="input"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'ACTIVE', 'OVERDUE', 'RETURNED'].map(status => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(0); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <table className="w-full">
            <tbody>
              {[...Array(5)].map((_, i) => <LoanSkeleton key={i} />)}
            </tbody>
          </table>
        ) : loans.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No loans found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {statusFilter !== 'ALL' ? `No ${statusFilter.toLowerCase()} loans` : 'Create your first loan from the book detail page'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3">Book</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Borrowed</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Renewals</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} className="table-row">
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{loan.bookTitle}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{loan.copyNumber}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300">
                      {loan.userName}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                      {new Date(loan.borrowedDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm ${loan.status === 'OVERDUE' ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                        {new Date(loan.dueDate).toLocaleDateString()}
                      </span>
                      {loan.daysOverdue > 0 && (
                        <span className="block text-xs text-red-600 dark:text-red-400">
                          {loan.daysOverdue} days overdue
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`badge ${
                        loan.status === 'OVERDUE' ? 'badge-danger' :
                        loan.status === 'RETURNED' ? 'badge-success' :
                        'badge-warning'
                      }`}>
                        {getStatusIcon(loan.status)}
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">
                      {loan.renewalCount || 0}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {(loan.status === 'ACTIVE' || loan.status === 'OVERDUE') && (
                          <>
                            {loan.canRenew && (
                              <button
                                onClick={() => handleRenew(loan.id)}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Renew"
                              >
                                <RefreshCw size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleReturn(loan.id)}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Return"
                            >
                              <CheckCircle size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
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
    </div>
  );
}
