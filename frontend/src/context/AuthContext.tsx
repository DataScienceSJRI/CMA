import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User } from "../types";
import {
  getCurrentUser,
  isAuthenticated,
  saveAuthData,
  clearAuthData,
} from "../utils/auth";
import { authAPI } from "../services/api";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(isAuthenticated());

  // On mount, re-validate the stored token with the server.
  // Catches: expired tokens, revoked sessions, deactivated accounts.
  //
  // IMPORTANT: only clears auth state on an explicit 401 response.
  // Network errors (offline, backend restarting) or server errors (5xx) leave
  // the cached token alone — the user's session may still be valid and they
  // would be wrongly logged out otherwise.
  useEffect(() => {
    if (!isAuthenticated()) return;

    authAPI.getCurrentUser()
      .then((freshUser: User) => {
        // Sync local state with the latest server-side user data
        // (role or department may have changed since last login).
        setUser(freshUser);
        setIsLoggedIn(true);
      })
      .catch((error: { response?: { status?: number } }) => {
        // The axios interceptor already handles token refresh on 401.
        // If we reach here it means refresh also failed — token is truly invalid.
        // Only clear auth for 401; leave it alone for 5xx / network errors.
        if (error?.response?.status === 401) {
          clearAuthData();
          setUser(null);
          setIsLoggedIn(false);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount

  const login = useCallback((token: string, userData: User, refreshToken?: string) => {
    saveAuthData(token, userData, refreshToken);
    setUser(userData);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    clearAuthData();
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
