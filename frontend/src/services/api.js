import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Books API
export const booksApi = {
  getAll: (page = 0, size = 10) => 
    api.get('/books', { params: { page, size } }),
  getById: (id) => api.get(`/books/${id}`),
  search: (query, page = 0, size = 10) => 
    api.get('/books/search', { params: { q: query, page, size } }),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
  getCopies: (bookId) => api.get(`/books/${bookId}/copies`),
  addCopy: (bookId, data) => api.post(`/books/${bookId}/copies`, data),
  updateCopyStatus: (copyId, status) => 
    api.patch(`/books/copies/${copyId}/status`, null, { params: { status } }),
};

 // Loans API
export const loansApi = {
 getAll: (page = 0, size = 10) =>
 api.get('/loans', { params: { page, size } }),
 getById: (id) => api.get(`/loans/${id}`),
 getByUser: (userId, page = 0, size = 10) =>
 api.get(`/loans/user/${userId}`, { params: { page, size } }),
 getMyLoans: () => api.get('/loans/my-loans'),
 getOverdue: () => api.get('/loans/overdue'),
 getCopyHistory: (copyId) => api.get(`/loans/copy/${copyId}/history`),
 create: (data) => api.post('/loans', data),
 borrow: (copyId) => api.post(`/loans/borrow/${copyId}`),
 return: (id) => api.post(`/loans/${id}/return`),
 renew: (id) => api.post(`/loans/${id}/renew`),
};

// Users API
export const usersApi = {
  getAll: (page = 0, size = 10) => 
    api.get('/users', { params: { page, size } }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
};

// Fees API
export const feesApi = {
  getByUser: (userId) => api.get(`/fees/user/${userId}`),
  getMyFees: () => api.get('/fees/my-fees'),
  getMyTotal: () => api.get('/fees/my-fees/total'),
  create: (userId, type, amount, description, loanId) =>
    api.post('/fees', null, { params: { userId, type, amount, description, loanId } }),
  markPaid: (id) => api.post(`/fees/${id}/pay`),
  delete: (id) => api.delete(`/fees/${id}`),
};

// Reservations API
export const reservationsApi = {
  getMyReservations: () => api.get('/reservations/my'),
  create: (bookId) => api.post(`/reservations/book/${bookId}`),
  cancel: (reservationId) => api.delete(`/reservations/${reservationId}`),
};

// Notifications API
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};
