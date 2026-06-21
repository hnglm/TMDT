import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5200/api', 
  timeout: 10000,
});

// 👑 SỬA LẠI: Tự động đính kèm Token JWT từ sessionStorage vào Header nếu người dùng đã đăng nhập
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Các hàm gọi API liên quan tới Người dùng (User)
export const authApi = {
  login: async (data: any) => {
    const response = await api.post('/user/login', data);
    return response.data;
  },
  register: async (data: any) => {
    const response = await api.post('/user/register', data);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },
  getAddresses: async () => {
    const response = await api.get('/user/addresses');
    return response.data;
  },
  updateProfile: async (data: { fullName: string; phone: string }) => {
    const response = await api.put('/user/profile', data);
    return response.data;
  }
};

export default api;