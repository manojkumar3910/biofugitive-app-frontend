import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  USER_TOKEN: '@biofugitive_token',
  USER_DATA: '@biofugitive_user',
  SESSION_EXPIRY: '@biofugitive_expiry',
};

// Session duration (24 hours in milliseconds)
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// Role constants (must match backend)
const ROLES = {
  admin: 'admin',       // Everything - Full system access
  officer: 'officer',   // Assigned cases only
  forensic: 'forensic', // Evidence only
  analyst: 'analyst',   // Read-only access
};

// Role display names
const ROLE_LABELS = {
  admin: 'Administrator',
  officer: 'Officer',
  forensic: 'Forensic Specialist',
  analyst: 'Analyst',
};

// Create context
const AuthContext = createContext({
  isLoggedIn: false,
  isLoading: true,
  user: null,
  token: null,
  login: async () => {},
  logout: async () => {},
  checkSession: async () => {},
  isAdmin: () => false,
  isOfficer: () => false,
  isForensic: () => false,
  isAnalyst: () => false,
  hasRole: () => false,
  canAccessCases: () => false,
  canModifyEvidence: () => false,
  canModifyCases: () => false,
  isReadOnly: () => false,
});

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Check session on app start
  useEffect(() => {
    checkSession();
  }, []);

  // Role checking helpers
  const isAdmin = () => user?.role === ROLES.admin;
  const isOfficer = () => user?.role === ROLES.officer;
  const isForensic = () => user?.role === ROLES.forensic;
  const isAnalyst = () => user?.role === ROLES.analyst;
  
  const hasRole = (...roles) => roles.includes(user?.role);
  
  // Permission helpers
  const canAccessCases = () => hasRole(ROLES.admin, ROLES.officer, ROLES.forensic, ROLES.analyst);
  const canModifyCases = () => hasRole(ROLES.admin, ROLES.officer);
  const canModifyEvidence = () => hasRole(ROLES.admin, ROLES.forensic);
  const canManageUsers = () => isAdmin();
  const isReadOnly = () => isAnalyst();

  // Get role label
  const getRoleLabel = () => ROLE_LABELS[user?.role] || 'Unknown';

  // Check if there's a valid session
  const checkSession = async () => {
    try {
      setIsLoading(true);
      
      const [storedToken, storedUser, storedExpiry] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY),
      ]);

      if (storedToken && storedUser && storedExpiry) {
        const expiryTime = parseInt(storedExpiry, 10);
        const now = Date.now();

        if (now < expiryTime) {
          // Session is still valid
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsLoggedIn(true);
        } else {
          // Session expired - clear storage
          await clearStorage();
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      await clearStorage();
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (userToken, userData) => {
    try {
      const expiryTime = Date.now() + SESSION_DURATION;

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, userToken || 'authenticated'),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData || { id: 'user' })),
        AsyncStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, expiryTime.toString()),
      ]);

      setToken(userToken || 'authenticated');
      setUser(userData || { id: 'user' });
      setIsLoggedIn(true);

      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await clearStorage();
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  };

  // Clear all auth storage
  const clearStorage = async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      AsyncStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRY),
    ]);
  };

  // Extend session (call this on user activity)
  const extendSession = async () => {
    if (isLoggedIn) {
      const newExpiry = Date.now() + SESSION_DURATION;
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, newExpiry.toString());
    }
  };

  const value = {
    isLoggedIn,
    isLoading,
    user,
    token,
    login,
    logout,
    checkSession,
    extendSession,
    // Role checks
    isAdmin,
    isOfficer,
    isForensic,
    isAnalyst,
    hasRole,
    getRoleLabel,
    // Permission checks
    canAccessCases,
    canModifyCases,
    canModifyEvidence,
    canManageUsers,
    isReadOnly,
    // Constants
    ROLES,
    ROLE_LABELS,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { ROLES, ROLE_LABELS };
export default AuthContext;
