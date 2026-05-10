import api from './client';

export const authApi = {
  login: async (username: string, password: string) => {
    // Django REST Framework session auth - используем стандартный login
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    await api.post('/auth/login/', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    // После успешного входа сохраняем флаг
    localStorage.setItem('is_authenticated', 'true');
  },

  logout: async () => {
    await api.post('/auth/logout/');
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('auth_token');
  },

  getCurrentUser: async () => {
    const { data } = await api.get('/auth/user/');
    return data;
  },
};