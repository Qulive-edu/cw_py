import api from './client';

export const authApi = {
  register: async (username: string, email: string, password: string, password_confirm: string) => {
    const response = await api.post('/auth/register/', {
      username,
      email,
      password,
      password_confirm,
    });
    return response.data;
  },

  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    await api.post('/auth/login/', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
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