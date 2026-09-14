import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { booksApi, loansApi, usersApi } from '../services/api';
import { BookOpen, Users, ClipboardList, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, isLibrarian } = useAuth();
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    activeLoans: 0,
    overdueLoans: 0,
  });
  const [myLoans, setMyLoans] = useState([]);
  const [recentLoans, setRecentLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const promises = [booksApi.getAll(0, 100)];
      
      if (isLibrarian()) {
        promises.push(
          usersApi.getAll(0, 100),
          loansApi.getAll(0, 100),
          loansApi.getOverdue(),
        );
      }
      
      promises.push(loansApi.getMyLoans());
      
      const results = await Promise.all(promises);
      
      setStats({
        totalBooks: results[0].data.data.totalElements || 0,
        totalUsers: isLibrarian() ? results[1].data.data.totalElements : 0,
        activeLoans: isLibrarian() ? results[2].data.data.totalElements : 0,
        overdueLoans: isLibrarian() ? results[3].data.data.length : 0,
      });
      
      setMyLoans(results[results.length - 1].data.data || []);
      
      if (isLibrarian()) {
        const allLoans = results[2].data.data.content || [];
        setRecentLoans(allLoans.slice(0, 5));
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (loanId) => {
    try {
      await loansApi.return(loanId);
      toast.success('Book returned successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to return book');
    }
  };

  const handleRenew = async (loanId) => {
    try {
      await loansApi.renew(loanId);
      toast.success('Loan renewed successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to renew loan');
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.fullName}
        </h1>
        <p className="text-gray-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-value">{stats.totalBooks}</p>
              <p className="stat-label">Total Books</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {isLibrarian() && (
          <>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-value">{stats.totalUsers}</p>
                  <p className="stat-label">Total Users</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-value">{stats.activeLoans}</p>
                  <p className="stat-label">Active Loans</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-value">{stats.overdueLoans}</p>
                  <p className="stat-label">Overdue</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Active Loans */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">My Active Loans</h2>
            <Link to="/my-loans" className="text-blue-600 text-sm hover:underline">View all</Link>
          </div>
          
          {myLoans.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active loans</p>
          ) : (
            <div className="space-y-4">
              {myLoans.slice(0, 5).map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{loan.bookTitle}</p>
                    <p className="text-sm text-gray-500">Due: {new Date(loan.dueDate).toLocaleDateString()}</p>
                    {loan.daysOverdue > 0 && (
                      <span className="badge badge-danger mt-1">
                        {loan.daysOverdue} days overdue
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {loan.canRenew && (
                      <button onClick={() => handleRenew(loan.id)} className="btn-secondary text-sm py-1">
                        Renew
                      </button>
                    )}
                    <button onClick={() => handleReturn(loan.id)} className="btn-primary text-sm py-1">
                      Return
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Loans (Librarian only) */}
        {isLibrarian() && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Loans</h2>
              <Link to="/loans" className="text-blue-600 text-sm hover:underline">View all</Link>
            </div>
            
            {recentLoans.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No loans yet</p>
            ) : (
              <div className="space-y-3">
                {recentLoans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{loan.bookTitle}</p>
                      <p className="text-sm text-gray-500">{loan.userName}</p>
                    </div>
                    <span className={`badge ${loan.status === 'OVERDUE' ? 'badge-danger' : 'badge-success'}`}>
                      {loan.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/search" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Search className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">Search Books</span>
            </Link>
            <Link to="/my-loans" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <BookOpen className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-700">My Loans</span>
            </Link>
            {isLibrarian() && (
              <>
                <Link to="/books" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-700">Manage Books</span>
                </Link>
                <Link to="/loans" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <ClipboardList className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-gray-700">All Loans</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
