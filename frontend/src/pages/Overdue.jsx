import { useState, useEffect } from 'react';
import { loansApi } from '../services/api';
import { AlertTriangle } from 'lucide-react';
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
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">Overdue List</h1>
        <span className="badge badge-danger text-lg px-3 py-1">{overdueLoans.length}</span>
      </div>

      {overdueLoans.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <p className="text-gray-500 text-lg">No overdue books!</p>
          <p className="text-gray-400 mt-1">All books have been returned on time.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Book</th>
                <th className="px-6 py-3">Member</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Days Overdue</th>
                <th className="px-6 py-3">Renewals</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {overdueLoans.map((loan) => (
                <tr key={loan.id} className="table-row bg-red-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{loan.bookTitle}</p>
                    <p className="text-sm text-gray-500">{loan.copyNumber}</p>
                  </td>
                  <td className="px-6 py-4">{loan.userName}</td>
                  <td className="px-6 py-4">{new Date(loan.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-red-600">{loan.daysOverdue} days</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{loan.renewalCount}/2</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleReturn(loan.id)} className="btn-primary text-sm">
                      Mark Returned
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
