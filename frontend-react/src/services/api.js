// API Service - Handles all backend communication
// This is like a "phone book" for talking to your FastAPI backend

import axios from 'axios';

// Base URL of your backend
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default settings
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request automatically
// This "interceptor" runs before each API call
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Get token from browser storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Add to request
  }
  return config;
});

// ========================================
// AUTHENTICATION APIs
// ========================================

export const authAPI = {
  // Login user
  login: async (username, password) => {
    // Backend expects query parameters
    const response = await api.post(`/auth/login?username=${username}&password=${password}`);
    return response.data;
  },

  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Get current user info
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// ========================================
// CONSULTATION APIs (CRUD operations)
// ========================================

export const consultationAPI = {
  // READ - Get all personal consultations
  getPersonalConsultations: async () => {
    const response = await api.get('/consultations/personal');
    return response.data;
  },

  // READ - Get common/tracked consultations (for HOD/Faculty)
  getCommonConsultations: async () => {
    const response = await api.get('/consultations/common');
    return response.data;
  },

  // READ - Get consultations for a specific member
  getMemberConsultations: async (memberId) => {
    const response = await api.get(`/consultations/member/${memberId}`);
    return response.data;
  },

  // READ - Get single consultation by ID
  getConsultationById: async (id) => {
    const response = await api.get(`/consultations/${id}`);
    return response.data;
  },

  // CREATE - Add new consultation
  createConsultation: async (consultationData) => {
    const response = await api.post('/consultations/', consultationData);
    return response.data;
  },

  // UPDATE - Edit existing consultation
  updateConsultation: async (id, consultationData) => {
    const response = await api.put(`/consultations/${id}`, consultationData);
    return response.data;
  },

  // DELETE - Remove consultation
  deleteConsultation: async (id) => {
    const response = await api.delete(`/consultations/${id}`);
    return response.data;
  },
};

// ========================================
// MEMBER MANAGEMENT APIs
// ========================================

export const memberAPI = {
  // Get all managed members
  getManagedMembers: async () => {
    const response = await api.get('/consultations/members');
    return response.data;
  },

  // Add a member to management
  addManagedMember: async (memberData) => {
    const response = await api.post('/consultations/members', memberData);
    return response.data;
  },
};

// ========================================
// TRACKING APIs
// ========================================

export const trackingAPI = {
  // Add consultation to tracking
  addToTracking: async (consultationId) => {
    const response = await api.post('/consultations/tracking', { consultation_id: consultationId });
    return response.data;
  },
};

// ========================================
// REPORT APIs
// ========================================

export const reportAPI = {
  // Get monthly report
  getMonthlyReport: async (year, month) => {
    const response = await api.get('/consultations/reports/monthly', {
      params: { year, month },
    });
    return response.data;
  },

  // Get date range report
  getDateRangeReport: async (startDate, endDate) => {
    const response = await api.get('/consultations/reports/daterange', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },
};

// Export the base API instance in case you need custom calls
export default api;
