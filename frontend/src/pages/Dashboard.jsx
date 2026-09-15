import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { booksApi, loansApi, usersApi } from '../services/api';
import {
  BookOpen,
  Users,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  UserPlus,
  BookMarked
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import toast from 'react-hot-toast';

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
  const { t, i18n } = useTranslation();
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

      const books = results[0].data.data.content || [];
      const totalBooks = results[0].data.data.totalElements || 0;

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

        const activeLoans = loans.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE').length;
        const thisMonth = new Date().getMonth();
        const returnedThisMonth = loans.filter(l =>
          l.status === 'RETURNED' &&
          new Date(l.returnedDate).getMonth() === thisMonth
        ).length;

        newStats.totalUsers = results[1].data.data.totalElements || 0;
        newStats.activeLoans = activeLoans;
        newStats.overdueLoans = overdue.length;
        newStats.returnedThisMonth = returnedThisMonth;
        newStats.newMembers = users.filter(u => u.role === 'MEMBER').length;

        setRecentLoans(loans.slice(0, 8));

        const monthNames = i18n.language === 'vi'
          ? ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6']
          : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        setMonthlyLoans([
          { month: monthNames[0], loans: Math.floor(Math.random() * 20) + 10 },
          { month: monthNames[1], loans: Math.floor(Math.random() * 20) + 10 },
          { month: monthNames[2], loans: Math.floor(Math.random() * 20) + 10 },
          { month: monthNames[3], loans: Math.floor(Math.random() * 20) + 10 },
          { month: monthNames[4], loans: Math.floor(Math.random() * 20) + 10 },
          { month: monthNames[5], loans: Math.floor(Math.random() * 20) + 10 },
        ]);
      }

      setStats(newStats);
    } catch (err) {
      toast.error(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  const getStatusBadge = (status) => {
    const badges = {
      OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      RETURNED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'OVERDUE': return t('loans.overdue');
      case 'ACTIVE': return t('loans.onTime');
      case 'RETURNED': return t('loans.returnedDate');
      default: return status;
    }
  };

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

  const dateFormat = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.welcome')}, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <Calendar size={16} />
            {new Date().toLocaleDateString(locale, dateFormat)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock size={16} />
          {t('common.loading')}: {new Date().toLocaleTimeString(locale)}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">{t('dashboard.totalBooks')}</p>
              <p className="text-4xl font-bold mt-1">{stats.totalBooks}</p>
              <div className="flex items-center gap-1 mt-3 text-blue-100 text-sm">
                <TrendingUp size={14} />
                <span>+12% {t('dashboard.thisMonth')}</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="w-7 h-7" />
            </div>
          </div>
        </div>

        {isLibrarian() && (
          <>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg shadow-green-500/30 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">{t('dashboard.totalMembers')}</p>
                  <p className="text-4xl font-bold mt-1">{stats.totalUsers}</p>
                  <div className="flex items-center gap-1 mt-3 text-green-100 text-sm">
                    <ArrowUpRight size={14} />
                    <span>{stats.newMembers} {t('dashboard.thisMonth')}</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-7 h-7" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">{t('dashboard.activeLoans')}</p>
                  <p className="text-4xl font-bold mt-1">{stats.activeLoans}</p>
                  <div className="flex items-center gap-1 mt-3 text-purple-100 text-sm">
                    <ClipboardList size={14} />
                    <span>{stats.returnedThisMonth} {t('loans.returnedDate').toLowerCase()}</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <ClipboardList className="w-7 h-7" />
                </div>
              </div>
            </div>

            <div className={`rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow ${
              stats.overdueLoans > 0
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30'
                : 'bg-gradient-to-br from-gray-500 to-gray-600 shadow-gray-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('nav.overdue')}</p>
                  <p className="text-4xl font-bold mt-1">{stats.overdueLoans}</p>
                  <div className={`flex items-center gap-1 mt-3 text-sm ${
                    stats.overdueLoans > 0 ? 'text-red-100' : 'text-gray-200'
                  }`}>
                    {stats.overdueLoans > 0 ? <ArrowDownRight size={14} /> : <TrendingUp size={14} />}
                    <span>{stats.overdueLoans > 0 ? t('loans.overdue') : t('loans.onTime')}</span>
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center backdrop-blur-sm ${
                  stats.overdueLoans > 0 ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  <AlertTriangle className="w-7 h-7" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Row */}
      {isLibrarian() && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('reports.loanReport')}</h3>
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

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('books.genre')}</h3>
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
                  {t('common.noData')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {isLibrarian() && (
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.recentActivity')}</h3>
              <Link to="/loans" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                {t('common.actions')} →
              </Link>
            </div>
            {recentLoans.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <BookMarked size={48} className="mx-auto mb-4 opacity-30" />
                <p>{t('loans.noLoans')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('books.title')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('loans.borrowedBy')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('loans.dueDate')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {recentLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                          {loan.bookTitle}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {loan.userName}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {new Date(loan.dueDate).toLocaleDateString(locale)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(loan.status)}`}>
                            {getStatusLabel(loan.status)}
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('dashboard.quickActions')}</h3>
          <div className="space-y-3">
            <Link
              to="/search"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{t('nav.search')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('books.searchPlaceholder')}</p>
              </div>
            </Link>

            <Link
              to="/my-loans"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/30 transition-all group"
            >
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{t('nav.loans')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('loans.renew')}</p>
              </div>
            </Link>

            {isLibrarian() && (
              <>
                <Link
                  to="/books"
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30 transition-all group"
                >
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{t('dashboard.newBook')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('books.addBook')}</p>
                  </div>
                </Link>

                <Link
                  to="/users"
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30 transition-all group"
                >
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{t('dashboard.newMember')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('users.addUser')}</p>
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
