import axios from 'axios';

// Hàm chuyển camelCase sang PascalCase
const toPascalCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toPascalCase);
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result: any, key: string) => {
      const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
      result[pascalKey] = toPascalCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

const api = axios.create({
  baseURL: 'https://clause-accuracy-kangaroo.ngrok-free.dev',
  timeout: 10000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

// Transformer: Convert camelCase to PascalCase trước khi gửi
api.interceptors.request.use((config) => {
  if (config.data) {
    config.data = toPascalCase(config.data);
  }
  
  const token = sessionStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Trong src/api/api.ts
export const orderApi = {
  // Gửi thông tin đơn hàng lên Backend
  createOrder: async (data: { 
    receiverName: string; 
    receiverPhone: string; 
    shippingAddress: string; 
    customerNote?: string;
    couponCode?: string;
    paymentMethod: string;
    items: { productId: number; variantId: number; quantity: number }[] 
  }) => {
    const response = await api.post('/api/orders', data);
    return response.data;
  }
};

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