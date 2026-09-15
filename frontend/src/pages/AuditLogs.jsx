import { useState, useEffect } from 'react';
import { History, Filter, Download, User, BookOpen, ClipboardList, Settings, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, filterAction, filterEntity]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: 20 });
      if (filterAction) params.append('action', filterAction);
      if (filterEntity) params.append('entityType', filterEntity);

      const res = await fetch(`http://localhost:8080/api/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      setLogs(data.data?.content || []);
      setTotalPages(data.data?.totalPages || 0);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return <span className="text-green-500">+</span>;
      case 'UPDATE': return <span className="text-blue-500">~</span>;
      case 'DELETE': return <span className="text-red-500">-</span>;
      default: return <span className="text-gray-500">*</span>;
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE': return 'badge-success';
      case 'UPDATE': return 'badge-info';
      case 'DELETE': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  const getEntityIcon = (entityType) => {
    switch (entityType) {
      case 'BOOK': return <BookOpen size={14} />;
      case 'USER': return <User size={14} />;
      case 'LOAN': return <ClipboardList size={14} />;
      case 'SETTINGS': return <Settings size={14} />;
      default: return null;
    }
  };

  const formatJson = (json) => {
    if (!json) return null;
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  };

  const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'BORROW', 'RETURN', 'RENEW'];
  const entities = ['BOOK', 'USER', 'LOAN', 'COPY', 'FEE', 'RESERVATION', 'SETTINGS'];

  if (loading && logs.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <History className="w-8 h-8" />
            Audit Logs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track all administrative actions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Filters:</span>
          </div>
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
            className="input w-full md:w-48"
          >
            <option value="">All Actions</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select
            value={filterEntity}
            onChange={(e) => { setFilterEntity(e.target.value); setPage(0); }}
            className="input w-full md:w-48"
          >
            <option value="">All Entities</option>
            {entities.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          {(filterAction || filterEntity) && (
            <button
              onClick={() => { setFilterAction(''); setFilterEntity(''); }}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-16">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="table-row">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${getActionBadge(log.action)}`}>
                          {getActionIcon(log.action)} {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getEntityIcon(log.entityType)}
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {log.entityType}
                          {log.entityId && ` #${log.entityId}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 dark:text-white">{log.userName || 'System'}</p>
                        {log.ipAddress && (
                          <p className="text-xs text-gray-400">{log.ipAddress}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {log.newValue && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:underline">
                            View changes
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto max-w-xs">
                            {formatJson(log.newValue)}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock size={14} />
                        {new Date(log.createdAt).toLocaleString()}
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
