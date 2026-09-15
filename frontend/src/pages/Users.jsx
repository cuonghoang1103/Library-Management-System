import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usersApi } from '../services/api';
import { Plus, Edit, Trash2, Users as UsersIcon, Search, Shield, User, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

// Skeleton
const UserSkeleton = ({ index }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
      </div>
    </div>
  </div>
);

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'MEMBER',
    active: true,
  });

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll(page, 20);
      let usersData = res.data.data.content || [];

      // Filter by role
      if (roleFilter !== 'ALL') {
        usersData = usersData.filter(u => u.role === roleFilter);
      }

      // Filter by status
      if (statusFilter !== 'ALL') {
        const isActive = statusFilter === 'ACTIVE';
        usersData = usersData.filter(u => u.active === isActive);
      }

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        usersData = usersData.filter(u =>
          u.username?.toLowerCase().includes(term) ||
          u.fullName?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term)
        );
      }

      setUsers(usersData);
      setTotalPages(res.data.data.totalPages || 0);
      setTotalElements(res.data.data.totalElements || 0);
    } catch (err) {
      toast.error(t('users.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, formData);
        toast.success(t('users.updateSuccess'));
      } else {
        await usersApi.create(formData);
        toast.success(t('users.createSuccess'));
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || t('users.operationFailed'));
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      active: user.active,
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (id) => {
    try {
      await usersApi.toggleStatus(id);
      toast.success(t('users.statusUpdated'));
      fetchUsers();
    } catch (err) {
      toast.error(t('users.updateStatusFailed'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('users.confirmDelete'))) return;
    try {
      await usersApi.delete(id);
      toast.success(t('users.deleteSuccess'));
      fetchUsers();
    } catch (err) {
      toast.error(t('users.deleteFailed'));
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      role: 'MEMBER',
      active: true,
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('users.pageTitle')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalElements > 0 ? `${totalElements} ${t('users.users')}` : t('users.noUsersFound')}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingUser(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          {t('users.addUser')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('users.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
              className="input w-auto"
            >
              <option value="ALL">{t('users.allRoles')}</option>
              <option value="MEMBER">{t('users.members')}</option>
              <option value="LIBRARIAN">{t('users.librarians')}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="input w-auto"
            >
              <option value="ALL">{t('users.allStatus')}</option>
              <option value="ACTIVE">{t('users.active')}</option>
              <option value="INACTIVE">{t('users.inactive')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <UserSkeleton key={i} />)}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <UsersIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('users.noUsersFound')}</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL'
              ? t('users.tryAdjustingFilters')
              : t('users.addFirstUser')
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                    user.role === 'LIBRARIAN'
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                      : 'bg-gradient-to-br from-green-500 to-teal-500'
                  }`}>
                    {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{user.fullName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                  </div>
                </div>
              {/* Role Badge */}
              <span className={`badge ${
                user.role === 'LIBRARIAN' ? 'badge-info' : 'badge-success'
              }`}>
                {user.role === 'LIBRARIAN' ? (
                  <><Shield size={12} className="mr-1" />{t('users.librarian')}</>
                ) : (
                  <><User size={12} className="mr-1" />{t('users.member')}</>
                )}
              </span>
              </div>

              {/* Info */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail size={14} />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone size={14} />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <button
            onClick={() => handleToggleStatus(user.id)}
            className={`text-sm font-medium ${
              user.active
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
            } hover:underline`}
          >
            {user.active ? t('users.active') : t('users.inactive')}
          </button>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleEdit(user)}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title={t('users.edit')}
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDelete(user.id)}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title={t('users.delete')}
            >
              <Trash2 size={16} />
            </button>
          </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="btn-secondary disabled:opacity-50"
          >
            {t('common.previous')}
          </button>
          <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
            {t('common.page')} {page + 1} {t('common.of')} {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="btn-secondary disabled:opacity-50"
          >
            {t('common.next')}
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingUser ? t('users.editUser') : t('users.addNewUser')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('users.username')} *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="input"
                    required
                    disabled={editingUser}
                  />
                </div>
                <div>
                  <label className="label">{editingUser ? t('users.newPassword') : t('users.password')} *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="input"
                    required={!editingUser}
                  />
                </div>
              </div>

              <div>
                <label className="label">{t('users.fullName')} *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">{t('users.email')} *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('users.phone')}</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">{t('users.role')} *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="input"
                  >
                    <option value="MEMBER">{t('users.member')}</option>
                    <option value="LIBRARIAN">{t('users.librarian')}</option>
                  </select>
                </div>
              </div>

              {editingUser && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">
                    {t('users.activeUser')}
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? t('users.updateUser') : t('users.createUser')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
