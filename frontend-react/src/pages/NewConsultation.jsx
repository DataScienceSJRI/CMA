// New Consultation Entry Form
// CREATE operation - adds new consultation to backend

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultationAPI } from '../services/api';

function NewConsultation() {
  const navigate = useNavigate();
  
  // Form state - each field has its own state variable
  const [formData, setFormData] = useState({
    date: '',
    g_name: '', // Backend expects 'g_name' not 'guest_name'
    profession: '',
    department: '',
    reason: '',
    description: '',
    time_spent: 0, // Required by backend
    project_from: '', // Required by backend
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  // Handle input changes - updates formData state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,      // Keep all other fields
      [name]: value // Update only the changed field
    }));
  };

  // Handle form submission - CREATE operation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Send data to backend
      await consultationAPI.createConsultation(formData);
      
      // Success! Go back to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create consultation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4 transition-colors duration-200">
        <div className="bg-card-light dark:bg-card-dark w-full max-w-lg rounded-xl shadow-xl border border-primary/20 dark:border-primary/10 overflow-hidden relative">
          {/* Top accent bar */}
          <div className="h-2 bg-primary w-full"></div>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                <span className="material-icons text-2xl">edit_note</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Entry Form</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Log a new consultation session details below.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Date Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="date">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-400 text-sm">calendar_today</span>
                  </div>
                  <input
                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-colors"
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Guest Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="g_name">
                  Guest Name <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-400 text-sm">person</span>
                  </div>
                  <input
                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-colors"
                    id="g_name"
                    name="g_name"
                    type="text"
                    placeholder="e.g. Dr. John Doe"
                    value={formData.g_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Profession Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="profession">
                  Profession <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-400 text-sm">work</span>
                  </div>
                  <select
                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-colors"
                    id="profession"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a profession</option>
                    <option>PhD Student</option>
                    <option>Medical Doctor</option>
                    <option>Nursing Staff</option>
                    <option>Researcher</option>
                    <option>Faculty</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* Department Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="department">
                  Department <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-400 text-sm">domain</span>
                  </div>
                  <input
                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-colors"
                    id="department"
                    name="department"
                    type="text"
                    placeholder="e.g. Cardiology"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Reason Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="reason">
                  Reason <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-400 text-sm">help_outline</span>
                  </div>
                  <select
                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-colors"
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a reason</option>
                    <option>Thesis Analysis</option>
                    <option>Sample Size Calculation</option>
                    <option>Data Management</option>
                    <option>Statistical Review</option>
                    <option>Research Design</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <textarea
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-colors"
                    id="description"
                    name="description"
                    rows="3"
                    placeholder="Brief description of the consultation..."
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Time Spent Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="time_spent">
                  Time Spent (minutes) <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-400 text-sm">schedule</span>
                  </div>
                  <input
                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-colors"
                    id="time_spent"
                    name="time_spent"
                    type="number"
                    min="0"
                    placeholder="e.g. 60"
                    value={formData.time_spent}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Project From Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="project_from">
                  Project From <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-400 text-sm">business</span>
                  </div>
                  <input
                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-colors"
                    id="project_from"
                    name="project_from"
                    type="text"
                    placeholder="e.g. Research Grant XYZ"
                    value={formData.project_from}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Entry'}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800 px-8 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>Biostatistics Dept.</span>
            <span>© 2023 HOD System</span>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="fixed bottom-4 right-4 p-3 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-lg border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform focus:outline-none"
        >
          <span className="material-icons dark:hidden">dark_mode</span>
          <span className="material-icons hidden dark:block">light_mode</span>
        </button>
      </div>
    </div>
  );
}

export default NewConsultation;
