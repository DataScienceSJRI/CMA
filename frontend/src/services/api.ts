import axios from "axios";
import { getRefreshToken, updateToken, clearAuthData } from "../utils/auth";
import type {
  AuthResponse,
  Consultation,
  ConflictNotification,
  ConsultationFormData,
  DeptSummary,
  FacultyUser,
  HierarchicalReport,
  Invoice,
  InvoiceSendData,
  ManagedMember,
  PendingConsultation,
  PublicConsultFormData,
  PublicUserResult,
  ReportSummary,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401: try to silently refresh the token once, then retry the original request.
// If refresh also fails, clear auth data and redirect to sign-in.
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuthData();
        window.location.replace("/signin");
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue requests that arrive while a refresh is in progress
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        updateToken(data.access_token, data.refresh_token);
        api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
        refreshQueue.forEach((cb) => cb(data.access_token));
        refreshQueue = [];
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch {
        clearAuthData();
        refreshQueue = [];
        window.location.replace("/signin");
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ========================================
// AUTHENTICATION APIs
// ========================================

export const authAPI = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", { username, password });
    return response.data;
  },

  register: async (userData: {
    username: string;
    password?: string;
    role: string;
    department?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<{ message: string }> => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
};

// ========================================
// CONSULTATION APIs
// ========================================

export const consultationAPI = {
  getPersonalConsultations: async (params?: { page?: number; page_size?: number; status?: string }): Promise<Consultation[]> => {
    const response = await api.get("/consultations/personal", { params });
    return response.data?.data ?? response.data;
  },

  getCommonConsultations: async (): Promise<Consultation[]> => {
    const response = await api.get("/consultations/common");
    return response.data?.data ?? response.data;
  },

  getMemberConsultations: async (memberId: string): Promise<Consultation[]> => {
    const response = await api.get(`/consultations/member/${memberId}`);
    return response.data?.data ?? response.data;
  },

  getConsultationById: async (id: string): Promise<Consultation> => {
    const response = await api.get(`/consultations/${id}`);
    return response.data;
  },

  createConsultation: async (data: ConsultationFormData): Promise<Consultation> => {
    const response = await api.post("/consultations/", data);
    return response.data;
  },

  updateConsultation: async (
    id: string,
    data: Partial<ConsultationFormData>
  ): Promise<Consultation> => {
    const response = await api.put(`/consultations/${id}`, data);
    return response.data;
  },

  deleteConsultation: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/consultations/${id}`);
    return response.data;
  },

  getPendingConsultations: async (): Promise<PendingConsultation[]> => {
    const response = await api.get("/consultations/pending");
    return response.data?.data ?? response.data;
  },

  assignConsultation: async (
    consultationId: string,
    userId: string
  ): Promise<Consultation> => {
    const response = await api.post(`/consultations/${consultationId}/assign`, {
      user_id: userId,
    });
    return response.data;
  },

  getAllConsultations: async (params?: {
    status?: string;
    payment_status?: string;
    assigned_to_user_id?: string;
  }): Promise<Consultation[]> => {
    const response = await api.get("/consultations/all", { params });
    return response.data?.data ?? response.data;
  },

  getConflictNotifications: async (): Promise<ConflictNotification[]> => {
    const response = await api.get("/consultations/conflicts");
    return response.data;
  },
};

// ========================================
// MEMBER MANAGEMENT APIs
// ========================================

export const memberAPI = {
  getManagedMembers: async (): Promise<ManagedMember[]> => {
    const response = await api.get("/consultations/members");
    return response.data;
  },

  addManagedMember: async (memberData: {
    managed_member_user_id: string;
    member_type?: string;
  }): Promise<ManagedMember> => {
    const response = await api.post("/consultations/members", memberData);
    return response.data;
  },
};

// ========================================
// TRACKING APIs
// ========================================

export const trackingAPI = {
  addToTracking: async (consultationId: string): Promise<{ tracking_id: string }> => {
    const response = await api.post("/consultations/tracking", {
      consultation_id: consultationId,
    });
    return response.data;
  },

  removeFromTracking: async (consultationId: string): Promise<{ message: string }> => {
    const response = await api.delete("/consultations/tracking", {
      data: { consultation_id: consultationId },
    });
    return response.data;
  },
};

// ========================================
// REPORT APIs
// ========================================

export const reportAPI = {
  getMonthlyReport: async (year: number, month: number): Promise<ReportSummary> => {
    const response = await api.get("/consultations/reports/monthly", {
      params: { year, month },
    });
    return response.data;
  },

  getDateRangeReport: async (
    startDate: string,
    endDate: string
  ): Promise<ReportSummary> => {
    const response = await api.get("/consultations/reports/daterange", {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getHierarchicalReport: async (params: {
    year?: number;
    month?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<HierarchicalReport> => {
    const response = await api.get("/consultations/reports/hierarchical", { params });
    return response.data;
  },
};

// ========================================
// USER / DEPARTMENT APIs
// ========================================

export const userAPI = {
  getHodOverview: async (): Promise<DeptSummary[]> => {
    const response = await api.get("/users/hod-overview");
    return response.data;
  },

  searchUsers: async (q: string): Promise<FacultyUser[]> => {
    const response = await api.get("/users/search", { params: { q } });
    return response.data;
  },

  getDepartments: async (): Promise<string[]> => {
    const response = await api.get("/users/departments");
    return response.data;
  },

  getFacultyByDepartment: async (department: string): Promise<FacultyUser[]> => {
    const response = await api.get("/users/faculty", { params: { department } });
    return response.data;
  },

  getFacultyManagedMembers: async (facultyId: string): Promise<ManagedMember[]> => {
    const response = await api.get(`/users/${facultyId}/managed-members`);
    return response.data;
  },

  addFacultyManagedMember: async (
    facultyId: string,
    data: { managed_member_user_id: string; member_type?: string }
  ): Promise<ManagedMember> => {
    const response = await api.post(`/users/${facultyId}/managed-members`, data);
    return response.data;
  },

  getUserProfile: async (userId: string): Promise<FacultyUser> => {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },
};

// ========================================
// PUBLIC APIs (no auth — QR code form)
// ========================================

// Separate axios instance that never attaches an Authorization header
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const publicAPI = {
  getDepartments: async (): Promise<string[]> => {
    const response = await publicApi.get("/public/departments");
    return response.data;
  },

  searchUsers: async (
    q: string,
    department: string
  ): Promise<PublicUserResult[]> => {
    const response = await publicApi.get("/public/users/search", {
      params: { q, department },
    });
    return response.data;
  },

  submitConsultation: async (
    data: PublicConsultFormData
  ): Promise<Consultation> => {
    const response = await publicApi.post("/public/consultation", data);
    return response.data;
  },
};

// ========================================
// INVOICE APIs
// ========================================

export const invoiceAPI = {
  getNextNumber: async (): Promise<{ invoice_number: string }> => {
    const response = await api.get("/invoices/next-number");
    return response.data;
  },

  send: async (data: InvoiceSendData): Promise<Invoice> => {
    const response = await api.post("/invoices/send", data);
    return response.data;
  },
};

export default api;
