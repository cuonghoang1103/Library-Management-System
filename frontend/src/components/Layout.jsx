import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Search, 
  BookOpen, 
  ClipboardList, 
  Users, 
  LogOut, 
  AlertTriangle,
  BookMarked
} from 'lucide-react';

export default function Layout() {
  const { user, logout, isLibrarian } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookMarked className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Library</h1>
              <p className="text-xs text-gray-500">Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/dashboard" className={({ isActive }) => 
            `sidebar-link ${isActive ? 'active' : ''}`
          }>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>

          <NavLink to="/search" className={({ isActive }) => 
            `sidebar-link ${isActive ? 'active' : ''}`
          }>
            <Search size={20} />
            Search Books
          </NavLink>

          <NavLink to="/my-loans" className={({ isActive }) => 
            `sidebar-link ${isActive ? 'active' : ''}`
          }>
            <BookOpen size={20} />
            My Loans
          </NavLink>

          {isLibrarian() && (
            <>
              <NavLink to="/books" className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }>
                <BookOpen size={20} />
                Manage Books
              </NavLink>

              <NavLink to="/loans" className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }>
                <ClipboardList size={20} />
                All Loans
              </NavLink>

              <NavLink to="/overdue" className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }>
                <AlertTriangle size={20} />
                Overdue List
              </NavLink>

              <NavLink to="/users" className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }>
                <Users size={20} />
                Manage Users
              </NavLink>
            </>
          )}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {user?.fullName?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
