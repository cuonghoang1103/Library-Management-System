import { useState, useEffect } from 'react';
import { usersApi } from '../services/api';
import { Plus, Edit, Trash2, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
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
  }, [page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll(page, 10);
      setUsers(res.data.data.content || []);
      setTotalPages(res.data.data.totalPages || 0);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, formData);
        toast.success('User updated successfully');
      } else {
        await usersApi.create(formData);
        toast.success('User created successfully');
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
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
      toast.success('User status updated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersApi.delete(id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <button onClick={() => { resetForm(); setEditingUser(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">Full Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="table-row">
                  <td className="px-6 py-4 font-medium">{user.username}</td>
                  <td className="px-6 py-4">{user.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${user.role === 'LIBRARIAN' ? 'badge-info' : 'badge-success'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggleStatus(user.id)} className={`badge cursor-pointer ${user.active ? 'badge-success' : 'badge-danger'}`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(user)} className="p-2 text-gray-500 hover:text-blue-600">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-500 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-secondary">Previous</button>
          <span className="px-4 py-2">Page {page + 1} of {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="btn-secondary">Next</button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Username *</label>
                  <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="input" required disabled={editingUser} />
                </div>
                <div>
                  <label className="label">{editingUser ? 'New Password' : 'Password *'}</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="input" required={!editingUser} />
                </div>
              </div>
              <div>
                <label className="label">Full Name *</label>
                <input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone</label>
                  <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="label">Role *</label>
                  <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="input">
                    <option value="MEMBER">Member</option>
                    <option value="LIBRARIAN">Librarian</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
