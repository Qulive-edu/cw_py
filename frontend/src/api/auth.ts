// frontend/src/api/auth.ts
import api from './client';
import { AuthResponse, RegisterData, LoginData, User } from '@/types';

export const authApi = {
  /** Регистрация нового пользователя */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const { data: response } = await api.post<AuthResponse>('/auth/register/', data);
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('is_authenticated', 'true');
    }
    return response;
  },

  /** Вход в систему */
  login: async (data: LoginData): Promise<AuthResponse> => {
    const { data: response } = await api.post<AuthResponse>('/auth/login/', data);
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('is_authenticated', 'true');
    }
    return response;
  },

  /** Выход из системы */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/');
    } catch (e) {
      // Игнорируем ошибки при выходе
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('is_authenticated');
  },

  /** Получение данных текущего пользователя */
  getCurrentUser: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/user/');
    return data;
  },
};