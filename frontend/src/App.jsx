import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import Loans from './pages/Loans';
import MyLoans from './pages/MyLoans';
import Users from './pages/Users';
import Search from './pages/Search';
import Overdue from './pages/Overdue';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function LibrarianRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user || user.role !== 'LIBRARIAN') {
    return <Navigate to="/my-loans" replace />;
  }
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="search" element={<Search />} />
        <Route path="my-loans" element={<MyLoans />} />
        <Route path="books" element={<Books />} />
        <Route path="books/:id" element={<BookDetail />} />
        <Route path="loans" element={<LibrarianRoute><Loans /></LibrarianRoute>} />
        <Route path="users" element={<LibrarianRoute><Users /></LibrarianRoute>} />
        <Route path="overdue" element={<LibrarianRoute><Overdue /></LibrarianRoute>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
