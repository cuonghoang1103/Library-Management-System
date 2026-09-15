import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, BookOpen, Users, ClipboardList, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('loans');
  const [dateRange, setDateRange] = useState('all');
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch data based on report type
      let endpoint = '';
      switch (reportType) {
        case 'loans':
          endpoint = '/api/loans?page=0&size=1000';
          break;
        case 'books':
          endpoint = '/api/books?page=0&size=1000';
          break;
        case 'users':
          endpoint = '/api/users?page=0&size=1000';
          break;
        case 'overdue':
          endpoint = '/api/loans/overdue';
          break;
        default:
          break;
      }

      const res = await fetch(`http://localhost:8080${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await res.json();
      setData(result.data?.content || result.data || []);
    } catch (err) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    let headers = [];
    let rows = [];

    switch (reportType) {
      case 'loans':
        headers = ['ID', 'Book Title', 'User', 'Borrowed Date', 'Due Date', 'Returned Date', 'Status', 'Renewal Count'];
        rows = data.map(item => [
          item.id,
          item.bookTitle || '',
          item.userName || '',
          item.borrowedDate || '',
          item.dueDate || '',
          item.returnedDate || '',
          item.status || '',
          item.renewalCount || 0
        ]);
        break;
      case 'books':
        headers = ['ID', 'Title', 'Author', 'ISBN', 'Genre', 'Total Copies', 'Available'];
        rows = data.map(item => [
          item.id,
          item.title || '',
          item.author || '',
          item.isbn || '',
          item.genre || '',
          item.totalCopies || 0,
          item.availableCopies || 0
        ]);
        break;
      case 'users':
        headers = ['ID', 'Username', 'Full Name', 'Email', 'Role', 'Active'];
        rows = data.map(item => [
          item.id,
          item.username || '',
          item.fullName || '',
          item.email || '',
          item.role || '',
          item.active ? 'Yes' : 'No'
        ]);
        break;
      case 'overdue':
        headers = ['ID', 'Book Title', 'User', 'Due Date', 'Days Overdue'];
        rows = data.map(item => [
          item.id,
          item.bookTitle || '',
          item.userName || '',
          item.dueDate || '',
          item.daysOverdue || 0
        ]);
        break;
      default:
        break;
    }

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Report exported successfully');
  };

  const reportTypes = [
    { id: 'loans', label: 'Loan Report', icon: ClipboardList, desc: 'All loans and borrowing activity' },
    { id: 'books', label: 'Book Catalog', icon: BookOpen, desc: 'Complete book inventory' },
    { id: 'users', label: 'User Report', icon: Users, desc: 'Library members and activity' },
    { id: 'overdue', label: 'Overdue Report', icon: DollarSign, desc: 'Books past due date' }
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate and export library reports
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={loading || data.length === 0}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setReportType(type.id)}
            className={`card p-6 text-left transition-all hover:shadow-lg ${
              reportType === type.id
                ? 'ring-2 ring-blue-500 border-blue-500'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
              reportType === type.id
                ? 'bg-blue-100 dark:bg-blue-900/30'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <type.icon
                size={24}
                className={reportType === type.id ? 'text-blue-600' : 'text-gray-500'}
              />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{type.label}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{type.desc}</p>
          </button>
        ))}
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</span>
          </div>
          <div className="flex gap-2">
            {['all', 'today', 'week', 'month'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {reportTypes.find(t => t.id === reportType)?.label} Preview
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data.length} records found
          </p>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No data available for this report
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="sticky top-0">
                <tr className="table-header">
                  {reportType === 'loans' && (
                    <>
                      <th className="px-4 py-3">Book</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Borrowed</th>
                      <th className="px-4 py-3">Due</th>
                      <th className="px-4 py-3">Status</th>
                    </>
                  )}
                  {reportType === 'books' && (
                    <>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Author</th>
                      <th className="px-4 py-3">Genre</th>
                      <th className="px-4 py-3">Available</th>
                      <th className="px-4 py-3">Total</th>
                    </>
                  )}
                  {reportType === 'users' && (
                    <>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                    </>
                  )}
                  {reportType === 'overdue' && (
                    <>
                      <th className="px-4 py-3">Book</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Days Overdue</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 50).map((item, index) => (
                  <tr key={index} className="table-row">
                    {reportType === 'loans' && (
                      <>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {item.bookTitle}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.userName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {item.borrowedDate ? new Date(item.borrowedDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${
                            item.status === 'OVERDUE' ? 'badge-danger' :
                            item.status === 'RETURNED' ? 'badge-success' :
                            'badge-warning'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </>
                    )}
                    {reportType === 'books' && (
                      <>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.author}</td>
                        <td className="px-4 py-3">
                          {item.genre && <span className="badge badge-info">{item.genre}</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.availableCopies}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.totalCopies}</td>
                      </>
                    )}
                    {reportType === 'users' && (
                      <>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.fullName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">@{item.username}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.email}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${item.role === 'LIBRARIAN' ? 'badge-info' : 'badge-success'}`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${item.active ? 'badge-success' : 'badge-danger'}`}>
                            {item.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </>
                    )}
                    {reportType === 'overdue' && (
                      <>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.bookTitle}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.userName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge badge-danger">{item.daysOverdue} days</span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.length > 50 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500">
            Showing first 50 of {data.length} records. Export to CSV for full data.
          </div>
        )}
      </div>
    </div>
  );
}
