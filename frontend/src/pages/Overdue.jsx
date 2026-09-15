import { useState, useEffect } from 'react';
import { loansApi } from '../services/api';
import { AlertTriangle, CheckCircle, Clock, Shield, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Overdue() {
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverdue();
  }, []);

  const fetchOverdue = async () => {
    setLoading(true);
    try {
      const res = await loansApi.getOverdue();
      setOverdueLoans(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load overdue list');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (loanId) => {
    try {
      await loansApi.return(loanId);
      toast.success('Book returned successfully');
      fetchOverdue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to return book');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          overdueLoans.length > 0
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-green-100 dark:bg-green-900/30'
        }`}>
          {overdueLoans.length > 0 ? (
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overdue List</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {overdueLoans.length > 0
              ? `${overdueLoans.length} overdue loan${overdueLoans.length > 1 ? 's' : ''}`
              : 'No overdue books'
            }
          </p>
        </div>
        {overdueLoans.length > 0 && (
          <span className="ml-auto badge badge-danger text-lg px-3 py-1">
            {overdueLoans.length}
          </span>
        )}
      </div>

      {/* Overdue Loans */}
      {overdueLoans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            All books returned on time!
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Great job! There are no overdue books in the library system.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {overdueLoans.map((loan) => (
            <div
              key={loan.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 p-5 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Book & Member Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {loan.bookTitle}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Copy: {loan.copyNumber}
                    </p>
                  </div>
                </div>

                {/* Member */}
                <div className="flex items-center gap-3 lg:w-48">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Shield size={14} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{loan.userName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Member</p>
                  </div>
                </div>

                {/* Due Date */}
                <div className="text-center lg:w-32">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock size={14} />
                    Due
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {new Date(loan.dueDate).toLocaleDateString()}
                  </div>
                </div>

                {/* Days Overdue */}
                <div className="text-center lg:w-32">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Overdue by</div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertTriangle size={14} className="text-red-600 dark:text-red-400" />
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {loan.daysOverdue} day{loan.daysOverdue > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Renewals */}
                <div className="text-center lg:w-24">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Renewals</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {loan.renewalCount || 0}/2
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => handleReturn(loan.id)}
                  className="btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <CheckCircle size={18} />
                  Mark Returned
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {overdueLoans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Overdue</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {overdueLoans.length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Days Overdue</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {overdueLoans.reduce((sum, l) => sum + (l.daysOverdue || 0), 0)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Affected Members</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {new Set(overdueLoans.map(l => l.userId)).size}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
