import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { booksApi, loansApi, usersApi } from '../services/api';
import {
  BookOpen, Users, ClipboardList, AlertTriangle,
  TrendingUp, Calendar, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import toast from 'react-hot-toast';

// Skeleton Component
const StatSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
    <div className="flex justify-between">
      <div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user, isLibrarian } = useAuth();
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    activeLoans: 0,
    overdueLoans: 0,
    returnedThisMonth: 0,
    newMembers: 0
  });
  const [recentLoans, setRecentLoans] = useState([]);
  const [genreData, setGenreData] = useState([]);
  const [monthlyLoans, setMonthlyLoans] = useState([]);
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

      const results = await Promise.all(promises);

      // Process book stats
      const books = results[0].data.data.content || [];
      const totalBooks = results[0].data.data.totalElements || 0;

      // Genre distribution
      const genreCount = {};
      books.forEach(book => {
        if (book.genre) {
          genreCount[book.genre] = (genreCount[book.genre] || 0) + 1;
        }
      });
      setGenreData(Object.entries(genreCount).map(([name, value]) => ({ name, value })));

      const newStats = { totalBooks };

      if (isLibrarian()) {
        const users = results[1].data.data.content || [];
        const loans = results[2].data.data.content || [];
        const overdue = results[3].data.data || [];

        // Calculate stats
        const activeLoans = loans.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE').length;
        const thisMonth = new Date().getMonth();
        const returnedThisMonth = loans.filter(l =>
          l.status === 'RETURNED' &&
          new Date(l.returnedDate).getMonth() === thisMonth
        ).length;
        const newMembers = users.filter(u => {
          // Simplified - in real app would check createdAt
          return u.role === 'MEMBER';
        }).length;

        newStats.totalUsers = results[1].data.data.totalElements || 0;
        newStats.activeLoans = activeLoans;
        newStats.overdueLoans = overdue.length;
        newStats.returnedThisMonth = returnedThisMonth;
        newStats.newMembers = newMembers;

        // Recent loans
        setRecentLoans(loans.slice(0, 8));

        // Monthly loans (simulated data)
        setMonthlyLoans([
          { month: 'Jan', loans: Math.floor(Math.random() * 20) + 10 },
          { month: 'Feb', loans: Math.floor(Math.random() * 20) + 10 },
          { month: 'Mar', loans: Math.floor(Math.random() * 20) + 10 },
          { month: 'Apr', loans: Math.floor(Math.random() * 20) + 10 },
          { month: 'May', loans: Math.floor(Math.random() * 20) + 10 },
          { month: 'Jun', loans: Math.floor(Math.random() * 20) + 10 },
        ]);
      }

      setStats(newStats);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => <StatSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <Calendar size={16} />
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock size={16} />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Books</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalBooks}</p>
              <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400 text-sm">
                <TrendingUp size={14} />
                <span>+12% this month</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {isLibrarian() && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalUsers}</p>
                  <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400 text-sm">
                    <ArrowUpRight size={14} />
                    <span>{stats.newMembers} new</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Loans</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.activeLoans}</p>
                  <div className="flex items-center gap-1 mt-2 text-blue-600 dark:text-blue-400 text-sm">
                    <ClipboardList size={14} />
                    <span>{stats.returnedThisMonth} returned</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.overdueLoans}</p>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${stats.overdueLoans > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {stats.overdueLoans > 0 ? <ArrowDownRight size={14} /> : <TrendingUp size={14} />}
                    <span>{stats.overdueLoans > 0 ? 'Need attention' : 'All on time'}</span>
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stats.overdueLoans > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  <AlertTriangle className={`w-7 h-7 ${stats.overdueLoans > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Row */}
      {isLibrarian() && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Loans Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Loans This Year</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyLoans}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="loans" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Genre Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Books by Genre</h3>
            <div className="h-64 flex items-center">
              {genreData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full text-center text-gray-500 dark:text-gray-400">
                  No genre data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Loans */}
        {isLibrarian() && (
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Loans</h3>
              <Link to="/loans" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                View all
              </Link>
            </div>
            {recentLoans.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No loans yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-2">Book</th>
                      <th className="px-4 py-2">User</th>
                      <th className="px-4 py-2">Due Date</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLoans.map((loan) => (
                      <tr key={loan.id} className="table-row">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                          {loan.bookTitle}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {loan.userName}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {new Date(loan.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${
                            loan.status === 'OVERDUE' ? 'badge-danger' :
                            loan.status === 'ACTIVE' ? 'badge-success' :
                            'badge-info'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/search"
              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Search Books</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Find and borrow</p>
              </div>
            </Link>

            <Link
              to="/my-loans"
              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">My Loans</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View & renew</p>
              </div>
            </Link>

            {isLibrarian() && (
              <>
                <Link
                  to="/books"
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Manage Books</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add or edit</p>
                  </div>
                </Link>

                <Link
                  to="/users"
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Manage Users</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Members</p>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
