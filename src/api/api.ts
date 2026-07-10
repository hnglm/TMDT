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
  baseURL: 'http://localhost:5200',
  timeout: 10000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use((config) => {
  if (config.data && !(config.data instanceof FormData)) {
    config.data = toPascalCase(config.data);
  }

  const token = sessionStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


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
  },
  requestReturnWarranty: async (
  orderId: string,
  data: { reason: string; accountInfo?: string }
) => {
  const response = await api.post(`/api/orders/${orderId}/return`, data);
  return response.data;
},
getMyReview: async (orderId: string) => {
  const response = await api.get(`/api/orders/${orderId}/review`);
  return response.data;
},

updateReview: async (
  orderId: string,
  data: { productId: string; rating: number; comment: string; image?: File | null }
) => {
  const formData = new FormData();

  formData.append("ProductId", data.productId);
  formData.append("Rating", String(data.rating));
  formData.append("Comment", data.comment);

  if (data.image) {
    formData.append("image", data.image);
  }

  const response = await api.put(`/api/orders/${orderId}/review`, formData);
  return response.data;
},
 
  // 1. Lấy danh sách đơn hàng (để hiển thị trong UserProfile)
  getMyOrders: async () => {
    const response = await api.get('/api/orders/my-orders');
    return response.data;
  },
  cancelOrder: async (orderId: string, data: { reason: string }) => {
  // Lưu ý: Backend sẽ nhận được key là "Reason" do PascalCase Interceptor
  const response = await api.post(`/api/orders/${orderId}/cancel`, data);
  return response.data;
},

  addReview: async (
  orderId: string,
  data: { productId: string; rating: number; comment: string; image?: File | null }
) => {
  const formData = new FormData();

  formData.append("ProductId", data.productId);
  formData.append("Rating", String(data.rating));
  formData.append("Comment", data.comment);

  if (data.image) {
    formData.append("image", data.image);
  }

  const response = await api.post(`/api/orders/${orderId}/review`, formData);
  return response.data;
},

  // 3. Yêu cầu hoàn hàng
  // Backend sẽ nhận: { Reason }
  requestReturn: async (orderId: string, data: { reason: string }) => {
    const response = await api.post(`/api/orders/${orderId}/return`, data);
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
    const response = await api.get("/api/user/addresses");
    return response.data;
  },

  createAddress: async (data: {
    receiverName: string;
    receiverPhone: string;
    fullAddress: string;
    isDefault: boolean;
  }) => {
    const response = await api.post("/api/user/addresses", data);
    return response.data;
  },

  updateAddress: async (
    id: number | string,
    data: {
      receiverName: string;
      receiverPhone: string;
      fullAddress: string;
      isDefault: boolean;
    }
  ) => {
    const response = await api.put(`/api/user/addresses/${id}`, data);
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