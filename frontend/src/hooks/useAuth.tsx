// frontend/src/hooks/useAuth.tsx
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authApi } from '@/api/auth';
import { User, LoginData, RegisterData } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        if (mounted) {
          setLoading(false);
          setUser(null);
        }
        return;
      }
      
      try {
        const userData = await authApi.getCurrentUser();
        if (mounted) {
          setUser(userData);
        }
      } catch {
        // Токен невалиден
        localStorage.removeItem('auth_token');
        localStorage.removeItem('is_authenticated');
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    checkAuth();
    
    return () => { mounted = false; };
  }, []);

  const login = async (data: LoginData) => {
    setError(null);
    try {
      const response = await authApi.login(data);
      setUser(response.user);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Ошибка входа';
      setError(msg);
      throw err;
    }
  };

  const register = async (data: RegisterData) => {
    setError(null);
    try {
      const response = await authApi.register(data);
      setUser(response.user);
    } catch (err: any) {
      // Формируем понятное сообщение об ошибках валидации
      const errors = err.response?.data;
      let msg = 'Ошибка регистрации';
      
      if (errors?.password) {
        msg = errors.password.join(' ');
      } else if (errors?.password_confirm) {
        msg = errors.password_confirm.join(' ');
      } else if (errors?.username) {
        msg = errors.username.join(' ');
      } else if (errors?.email) {
        msg = errors.email.join(' ');
      } else if (errors?.detail) {
        msg = errors.detail;
      } else if (errors?.error) {
        msg = errors.error;
      }
      
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      loading,
      error,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};