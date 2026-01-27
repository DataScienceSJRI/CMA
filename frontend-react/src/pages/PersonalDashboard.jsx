// Personal Dashboard Component
// Displays user's consultations with CRUD operations

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultationAPI } from '../services/api';

function PersonalDashboard() {
  // State management
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('This Month');
  
  // Mock user for now (no auth)
  const user = { name: 'John Smith', role: 'Biostatistician' };
  
  const navigate = useNavigate();

  // Load consultations when component mounts
  useEffect(() => {
    loadConsultations();
  }, []);

  // Fetch consultations from backend
  const loadConsultations = async () => {
    try {
      setLoading(true);
      const data = await consultationAPI.getPersonalConsultations();
      console.log('Loaded consultations:', data);
      setConsultations(data);
      setError('');
    } catch (err) {
      setError('Failed to load consultations');
      console.error('Error loading consultations:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout (no-op for now)
  const handleLogout = () => {
    navigate('/dashboard');
  };

  // Handle delete consultation
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this consultation?')) {
      return;
    }

    try {
      await consultationAPI.deleteConsultation(id);
      // Remove from list immediately (optimistic update)
      setConsultations(consultations.filter(c => c.id !== id));
    } catch (err) {
      alert('Failed to delete consultation');
      console.error(err);
    }
  };

  // Calculate monthly consultation counts (for chart)
  const getMonthlyData = () => {
    // This is simplified - you can enhance with actual date filtering
    return [
      { month: 'Jan', count: 12 },
      { month: 'Feb', count: 18 },
      { month: 'Mar', count: 15 },
      { month: 'Apr', count: 22 },
      { month: 'May', count: 20 },
    ];
  };

  const monthlyData = getMonthlyData();
  const maxCount = Math.max(...monthlyData.map(d => d.count));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col shadow-sm">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-border-light dark:border-border-dark">
          <div className="flex items-center space-x-2">
            <span className="material-icons text-primary text-3xl">analytics</span>
            <span className="text-xl font-bold tracking-wide text-gray-800 dark:text-white">HOD Portal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <a
            className="flex items-center space-x-3 px-4 py-3 bg-primary/10 text-primary-dark dark:text-primary rounded-lg transition-colors font-medium"
            href="#"
          >
            <span className="material-icons">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a
            className="flex items-center space-x-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors group"
            href="#"
            onClick={(e) => { e.preventDefault(); navigate('/new-consultation'); }}
          >
            <span className="material-icons group-hover:text-primary transition-colors">add_box</span>
            <span>New Entry</span>
          </a>
          <a
            className="flex items-center space-x-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors group"
            href="#"
            onClick={(e) => { e.preventDefault(); navigate('/department'); }}
          >
            <span className="material-icons group-hover:text-primary transition-colors">people</span>
            <span>Department</span>
          </a>
          <a
            className="flex items-center space-x-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors group"
            href="#"
            onClick={(e) => { e.preventDefault(); navigate('/reports'); }}
          >
            <span className="material-icons group-hover:text-primary transition-colors">assessment</span>
            <span>Reports</span>
          </a>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border-light dark:border-border-dark">
          <div className="flex items-center space-x-3 mb-4 px-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'Member'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <span className="material-icons text-base">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Personal Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <span className="material-icons">notifications</span>
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <span className="material-icons">settings</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Chart Card */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Consultations</h2>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="form-select text-sm rounded-md border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-700 focus:ring-primary focus:border-primary"
                >
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Year</option>
                </select>
              </div>

              {/* Simple Bar Chart */}
              <div className="h-64 flex items-end justify-between space-x-2 px-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                {monthlyData.map((item) => (
                  <div key={item.month} className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.count}
                    </span>
                    <div
                      className="w-full bg-primary hover:bg-primary-hover rounded-t transition-all duration-300"
                      style={{ height: `${(item.count / maxCount) * 100}%` }}
                    ></div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Consultations Table */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
              <div className="p-6 border-b border-border-light dark:border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Consultations</h2>
                <div className="flex gap-2">
                  <input
                    type="search"
                    placeholder="Search..."
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary focus:border-primary"
                  />
                  <button
                    onClick={() => navigate('/new-consultation')}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md text-sm font-medium transition-colors"
                  >
                    + New
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Loading consultations...</p>
                </div>
              ) : consultations.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No consultations found. Create your first one!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guest Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-surface-dark divide-y divide-gray-200 dark:divide-gray-700">
                      {consultations.map((consultation) => (
                        <tr key={consultation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {new Date(consultation.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {consultation.guest_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {consultation.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {consultation.reason}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Completed
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => navigate(`/consultation/${consultation.id}/edit`)}
                              className="text-primary hover:text-primary-hover"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(consultation.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PersonalDashboard;
