// Sidebar Navigation Component
// Reusable sidebar for all pages

import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar({ user = { name: 'John Smith', role: 'Biostatistician', initials: 'JS' } }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if route is active
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col shadow-sm">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-border-light dark:border-border-dark">
        <div className="flex items-center space-x-2">
          <span className="material-icons text-primary text-3xl">analytics</span>
          <span className="text-xl font-bold tracking-wide text-gray-800 dark:text-white">CMS Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <button
          onClick={() => navigate('/dashboard')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium ${
            isActive('/dashboard')
              ? 'bg-primary/10 text-primary-dark dark:text-primary'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
          }`}
        >
          <span className="material-icons">dashboard</span>
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => navigate('/new-consultation')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
            isActive('/new-consultation')
              ? 'bg-primary/10 text-primary-dark dark:text-primary font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
          }`}
        >
          <span className="material-icons group-hover:text-primary transition-colors">add_box</span>
          <span>New Entry</span>
        </button>

        <button
          onClick={() => navigate('/department')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
            isActive('/department')
              ? 'bg-primary/10 text-primary-dark dark:text-primary font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
          }`}
        >
          <span className="material-icons group-hover:text-primary transition-colors">people</span>
          <span>Department</span>
        </button>

        <button
          onClick={() => navigate('/reports')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
            isActive('/reports')
              ? 'bg-primary/10 text-primary-dark dark:text-primary font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
          }`}
        >
          <span className="material-icons group-hover:text-primary transition-colors">assessment</span>
          <span>Reports</span>
        </button>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border-light dark:border-border-dark">
        <div className="flex items-center space-x-3 mb-4 px-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
            {user.initials}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-white">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
        >
          <span className="material-icons text-base">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
