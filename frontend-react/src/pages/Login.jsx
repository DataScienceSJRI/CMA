// Login Page Component
// Converted from login.html to React

import { useState } from 'react'; // Hook to manage component state
import { useNavigate } from 'react-router-dom'; // Hook to navigate between pages
import { authAPI } from '../services/api';
import { saveAuthData } from '../utils/auth';

function Login() {
  // State variables - these hold form data and UI state
  const [username, setUsername] = useState(''); // Stores username input
  const [password, setPassword] = useState(''); // Stores password input
  const [error, setError] = useState(''); // Stores error message
  const [loading, setLoading] = useState(false); // Shows loading state
  const [darkMode, setDarkMode] = useState(false); // Dark mode toggle

  const navigate = useNavigate(); // Function to change pages

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    setError(''); // Clear previous errors
    setLoading(true); // Show loading state

    try {
      // Call backend login API
      const data = await authAPI.login(username, password);
      
      // Save token and user data
      saveAuthData(data.access_token, data.user);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      // Show error message
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false); // Hide loading state
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4 transition-colors duration-300">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary bg-opacity-10 dark:bg-opacity-20 mb-4">
              <span className="material-icons-round text-primary text-4xl">analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark tracking-tight">
              Consultation Management System
            </h1>
            <p className="text-sm text-text-sub-light dark:text-text-sub-dark mt-2">
              Department of Biostatistics &amp; Data Science
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark overflow-hidden transition-colors duration-300">
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-text-main-light dark:text-text-main-dark">
                  Welcome back
                </h2>
                <p className="text-sm text-text-sub-light dark:text-text-sub-dark mt-1">
                  Please enter your credentials to access the dashboard.
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1.5" htmlFor="username">
                    Username or ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-icons-round text-text-sub-light dark:text-text-sub-dark text-xl"></span>
                    </div>
                    <input
                      className="block w-full pl-10 pr-3 py-2.5 border border-border-light dark:border-border-dark rounded-lg bg-input-bg-light dark:bg-input-bg-dark text-text-main-light dark:text-text-main-dark placeholder-text-sub-light dark:placeholder-text-sub-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 sm:text-sm"
                      id="username"
                      name="username"
                      placeholder="Enter your username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)} // Update state on change
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark" htmlFor="password">
                      Password
                    </label>
                    <a className="text-sm font-medium text-primary hover:text-primary-hover hover:underline" href="#">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-icons-round text-text-sub-light dark:text-text-sub-dark text-xl"></span>
                    </div>
                    <input
                      className="block w-full pl-10 pr-3 py-2.5 border border-border-light dark:border-border-dark rounded-lg bg-input-bg-light dark:bg-input-bg-dark text-text-main-light dark:text-text-main-dark placeholder-text-sub-light dark:placeholder-text-sub-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 sm:text-sm"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)} // Update state on change
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-gray-50 dark:bg-gray-800 border-t border-border-light dark:border-border-dark flex justify-center text-sm">
              <span className="text-text-sub-light dark:text-text-sub-dark">
                Need help?{' '}
                <a className="font-medium text-primary hover:text-primary-hover hover:underline ml-1" href="#">
                  Contact Support
                </a>
              </span>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 text-center">
            <p className="text-xs text-text-sub-light dark:text-text-sub-dark">
              © 2023 Biostatistics Department. All rights reserved.
            </p>
          </div>
        </div>

        {/* Dark Mode Toggle Button */}
        <div className="fixed bottom-4 right-4">
          <button
            className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg text-text-sub-light dark:text-text-sub-dark hover:text-primary transition-colors focus:outline-none border border-border-light dark:border-border-dark"
            onClick={() => setDarkMode(!darkMode)}
          >
            <span className="material-icons-round dark:hidden">dark_mode</span>
            <span className="material-icons-round hidden dark:block">light_mode</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
