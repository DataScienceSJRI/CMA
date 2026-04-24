import type { User } from "../types";

export const saveAuthData = (token: string, user: User, refreshToken?: string): void => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refresh_token");
};

export const updateToken = (token: string, refreshToken: string): void => {
  localStorage.setItem("token", token);
  localStorage.setItem("refresh_token", refreshToken);
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const clearAuthData = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("refresh_token");
};

export const hasRole = (role: string): boolean => {
  const user = getCurrentUser();
  return user !== null && user.role?.toLowerCase() === role.toLowerCase();
};

export const isHOD = (): boolean => hasRole("HOD");
export const isFaculty = (): boolean => hasRole("Faculty");
export const isMember = (): boolean => hasRole("Member");

export const canManageMembers = (): boolean => {
  const user = getCurrentUser();
  const role = user?.role?.toLowerCase();
  return role === "hod" || role === "faculty";
};
