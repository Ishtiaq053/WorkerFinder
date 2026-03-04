/**
 * ──────────────────────────────────────────────────────────────
 *  Auth Context
 *  Manages global authentication state using React Context API.
 *  Persists user session in localStorage.
 * ──────────────────────────────────────────────────────────────
 */
import { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const AuthContext = createContext(null);

/**
 * Custom hook to access auth state from any component.
 * Usage: const { user, token, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * AuthProvider wraps the app and provides auth state to all children.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking localStorage

  // On mount, restore session from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('wf_user');
      const savedToken = localStorage.getItem('wf_token');

      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch (err) {
      // If localStorage data is corrupted, clear it
      console.error('Failed to restore session:', err);
      localStorage.removeItem('wf_user');
      localStorage.removeItem('wf_token');
    }
    setLoading(false);
  }, []);

  /**
   * Login — save user data and token to state + localStorage.
   */
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('wf_user', JSON.stringify(userData));
    localStorage.setItem('wf_token', authToken);
  };

  /**
   * Logout — clear everything.
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('wf_user');
    localStorage.removeItem('wf_token');
  };

  // The value provided to all consumers of this context
  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
