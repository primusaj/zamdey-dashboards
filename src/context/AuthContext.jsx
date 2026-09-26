import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  
  // ⏳ LOADING STATE: This is the fix.
  // It starts as true, so the App knows to WAIT before redirecting anyone.
  const [loading, setLoading] = useState(true);

  // 🔄 1. ON REFRESH: RESTORE SESSION
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Read from browser memory
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('zamdey_user');
        const storedRole = localStorage.getItem('role');

        // If found, put it back into State
        if (storedToken && storedUser && storedRole) {
          setToken(storedToken);
          setRole(storedRole);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Session restore failed", error);
        localStorage.clear();
      } finally {
        // ✅ DONE: Tell the App it's safe to render the dashboard now
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // 🔑 2. LOGIN FUNCTION
  const login = (userData, authToken, userRole) => {
    setUser(userData);
    setToken(authToken);
    setRole(userRole);

    // Persist to browser memory
    localStorage.setItem('token', authToken);
    localStorage.setItem('role', userRole);
    localStorage.setItem('zamdey_user', JSON.stringify(userData));
  };

  // 🚪 3. LOGOUT FUNCTION
  const logout = () => {
    setUser(null);
    setToken(null);
    setRole(null);
    localStorage.clear();
    // Force reload to clear any lingering state
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};