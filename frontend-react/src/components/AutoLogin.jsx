// AutoLogin Component
// Automatically logs in as hod_science for testing

import { useEffect } from 'react';
import { authAPI } from '../services/api';

function AutoLogin({ children }) {
  useEffect(() => {
    const autoLogin = async () => {
      // Check if already logged in
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Already logged in with token:', token);
        return;
      }

      // Auto-login as hod_science for testing
      try {
        console.log('Auto-logging in as hod_science...');
        const response = await authAPI.login('hod_science', 'any_password');
        
        // Save token and user data
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        console.log('Auto-login successful:', response.user);
        
        // Refresh page to apply authentication
        window.location.reload();
      } catch (error) {
        console.error('Auto-login failed:', error);
      }
    };

    autoLogin();
  }, []);

  return <>{children}</>;
}

export default AutoLogin;
