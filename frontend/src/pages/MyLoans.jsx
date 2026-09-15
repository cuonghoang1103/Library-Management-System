import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loansApi } from '../services/api';
import { BookOpen, Clock, AlertTriangle, CheckCircle, RefreshCw, Calendar, Book, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyLoans() {
  const [activeLoans, setActiveLoans] = useState([]);
  const [historyLoans, setHistoryLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await loansApi.getMyLoans();
      const allLoans = res.data.data || [];

      // Split into active and history
      const active = allLoans.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE');
      const history = allLoans.filter(l => l.status === 'RETURNED' || l.status === 'CLOSED');

      setActiveLoans(active);
      setHistoryLoans(history);
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

  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getProgressPercent = (borrowedDate, dueDate) => {
    const start = new Date(borrowedDate);
    const end = new Date(dueDate);
    const today = new Date();
    const total = end - start;
    const elapsed = today - start;
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const loans = activeTab === 'active' ? activeLoans : historyLoans;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Loans</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activeLoans.length > 0
              ? `${activeLoans.length} active loan${activeLoans.length > 1 ? 's' : ''}`
              : 'No active loans'
            }
          </p>
        </div>
        <Link
          to="/search"
          className="btn-primary flex items-center gap-2"
        >
          <Book size={20} />
          Browse Books
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 w-fit">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'active'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Active ({activeLoans.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          History ({historyLoans.length})
        </button>
      </div>

      {/* Loans List */}
      {loans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {activeTab === 'active' ? 'No active loans' : 'No borrowing history'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {activeTab === 'active'
              ? 'You currently have no books on loan. Visit the library to borrow some books!'
              : 'Your returned books will appear here.'
            }
          </p>
          {activeTab === 'active' && (
            <Link
              to="/search"
              className="btn-primary inline-flex items-center gap-2"
            >
              Browse Books
              <ArrowRight size={18} />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const daysRemaining = getDaysRemaining(loan.dueDate);
            const progress = getProgressPercent(loan.borrowedDate, loan.dueDate);
            const isOverdue = loan.status === 'OVERDUE' || daysRemaining < 0;
            const canRenew = loan.canRenew && loan.renewalCount < 2;

            return (
              <div
                key={loan.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border p-5 transition-all hover:shadow-lg ${
                  isOverdue
                    ? 'border-red-200 dark:border-red-900/50'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Book Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {loan.bookTitle}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Copy: {loan.copyNumber}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`badge ${
                          loan.status === 'OVERDUE' ? 'badge-danger' :
                          loan.status === 'RETURNED' ? 'badge-success' :
                          'badge-warning'
                        }`}>
                          {isOverdue ? (
                            <><AlertTriangle size={12} className="mr-1" />Overdue</>
                          ) : loan.status === 'RETURNED' ? (
                            <><CheckCircle size={12} className="mr-1" />Returned</>
                          ) : (
                            <><Clock size={12} className="mr-1" />Active</>
                          )}
                        </span>
                        {loan.renewalCount > 0 && (
                          <span className="badge badge-info">
                            Renewed {loan.renewalCount}/2 times
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date Info */}
                  <div className="flex md:flex-row gap-6 md:gap-8">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Borrowed</div>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Calendar size={14} />
                        {new Date(loan.borrowedDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {isOverdue ? 'Was due' : 'Due in'}
                      </div>
                      <div className={`flex items-center gap-1 text-sm font-medium ${
                        isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        <Clock size={14} />
                        {isOverdue
                          ? `${Math.abs(daysRemaining)} days ago`
                          : `${daysRemaining} days`
                        }
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {activeTab === 'active' && (
                    <div className="w-full md:w-32">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isOverdue ? 'bg-red-500' : progress > 75 ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {activeTab === 'active' && (
                    <div className="flex gap-2 md:ml-4">
                      {canRenew && (
                        <button
                          onClick={() => handleRenew(loan.id)}
                          className="btn-secondary flex items-center gap-1 text-sm"
                          title="Renew loan"
                        >
                          <RefreshCw size={14} />
                          Renew
                        </button>
                      )}
                      <button
                        onClick={() => handleReturn(loan.id)}
                        className="btn-primary flex items-center gap-1 text-sm"
                      >
                        <CheckCircle size={14} />
                        Return
                      </button>
                    </div>
                  )}
                </div>

                {/* Loan Details */}
                {loan.returnedDate && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                    Returned on {new Date(loan.returnedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      {activeLoans.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeLoans.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Active Loans</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{historyLoans.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Books Returned</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {activeLoans.filter(l => getDaysRemaining(l.dueDate) <= 3 && getDaysRemaining(l.dueDate) > 0).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Due Soon</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {activeLoans.filter(l => l.status === 'OVERDUE').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Overdue</div>
          </div>
        </div>
      )}
    </div>
  );
}
