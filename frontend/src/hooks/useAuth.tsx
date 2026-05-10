import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authApi } from '@/api/auth';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const checkAuth = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch {
      setUser(null); // ← важно!
      localStorage.removeItem('is_authenticated'); // ← и это
    } finally {
      setLoading(false); // ← всегда сбрасываем
    }
  };
  
  if (localStorage.getItem('is_authenticated')) {
    checkAuth();
  } else {
    setLoading(false); // ← если нет флага — сразу готово
  }
}, []);

  const login = async (username: string, password: string) => {
    await authApi.login(username, password);
    const userData = await authApi.getCurrentUser();
    setUser(userData);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};