// Authentication Utility Functions
// Manages user login state and role checking

// Save login data to browser storage
export const saveAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

// Get current logged-in user
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Get current token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Check if user is logged in
export const isAuthenticated = () => {
  return !!getToken(); // !! converts to boolean (true if token exists)
};

// Clear login data (logout)
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Check user role
export const hasRole = (role) => {
  const user = getCurrentUser();
  return user && user.role === role;
};

// Check if user is HOD
export const isHOD = () => hasRole('hod');

// Check if user is Faculty
export const isFaculty = () => hasRole('faculty');

// Check if user is Member
export const isMember = () => hasRole('member');

// Check if user can manage others (HOD or Faculty)
export const canManageMembers = () => {
  const user = getCurrentUser();
  return user && (user.role === 'hod' || user.role === 'faculty');
};
