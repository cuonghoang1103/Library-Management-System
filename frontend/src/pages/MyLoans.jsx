import { useState, useEffect } from 'react';
import { loansApi } from '../services/api';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await loansApi.getMyLoans();
      setLoans(res.data.data || []);
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

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Loans</h1>

      {loans.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">You don't have any active loans</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <div key={loan.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{loan.bookTitle}</h3>
                  <p className="text-gray-500">Copy: {loan.copyNumber}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>Borrowed: {new Date(loan.borrowedDate).toLocaleDateString()}</span>
                    <span>Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
                  </div>
                  {loan.daysOverdue > 0 && (
                    <span className="badge badge-danger mt-2">
                      {loan.daysOverdue} days overdue
                    </span>
                  )}
                  {loan.renewalCount > 0 && (
                    <span className="badge badge-info mt-2 ml-2">
                      Renewed {loan.renewalCount}/2 times
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {loan.canRenew && (
                    <button onClick={() => handleRenew(loan.id)} className="btn-secondary text-sm">
                      Renew
                    </button>
                  )}
                  <button onClick={() => handleReturn(loan.id)} className="btn-primary text-sm">
                    Return
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
