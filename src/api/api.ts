import axios from 'axios';

const api = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const authApi = {
  login: async (data: any) => {
    const response = await api.post('/api/user/login', data);
    return response.data;
  },

  register: async (data: any) => {
    const response = await api.post('/api/user/register', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/user/profile');
    return response.data;
  },

  getAddresses: async () => {
    const response = await api.get('/api/user/addresses');
    return response.data;
  },

  updateProfile: async (data: { fullName: string; phone: string }) => {
    const response = await api.put('/api/user/profile', data);
    return response.data;
  },

  facebookLogin: async (data: { token: string }) => {
    const response = await api.post('/api/user/facebook-login', data);
    return response.data;
  },
  googleLogin: async (data: { token: string }) => {
  const response = await api.post('/api/user/google-login', data);
  return response.data;
},
};

export default api;