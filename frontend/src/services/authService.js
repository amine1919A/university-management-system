import api from './api';

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/accounts/token/', { 
      username, 
      password 
    });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  
  register: async (userData) => {
    return await api.post('/accounts/register/', userData);
  },
  
  getProfile: async () => {
    return await api.get('/accounts/profile/');
  },
  
  updateProfile: async (userData) => {
    return await api.put('/accounts/profile/', userData);
  },
};