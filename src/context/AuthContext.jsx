import { createContext, useContext, useState, useEffect } from 'react';
import { users as usersApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      usersApi.getMe()
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (tokenData) => {
    localStorage.setItem('token', tokenData.token);
    // Догружаем полный профиль чтобы сразу получить avatarUrl
    usersApi.getMe()
      .then(setUser)
      .catch(() => {
        setUser({
          email: tokenData.email,
          fullName: tokenData.fullName,
          role: tokenData.role,
        });
      });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Перезагрузить профиль (например после смены аватарки)
  const refreshUser = () => {
    usersApi.getMe().then(setUser).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      refreshUser,
      isAdmin: user?.role === 'Admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
