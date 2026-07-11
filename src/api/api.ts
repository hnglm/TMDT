import axios from 'axios';

// Hàm chuyển camelCase sang PascalCase
// ==========================================================================
// SỬA LẠI HÀM NÀY trong src/api/api.ts (đang nằm đầu file, ngay trước
// const api = axios.create(...)) — chỉ thêm 1 điều kiện chặn undefined/null
// ==========================================================================

const toPascalCase = (obj: any): any => {
  if (obj === undefined || obj === null) {
    return obj; // 🆕 chặn lỗi "Cannot read properties of undefined (reading 'constructor')"
  }
  if (Array.isArray(obj)) {
    return obj.map(toPascalCase);
  } else if (obj.constructor === Object) {
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

export const orderApi = {
  // Gửi thông tin đơn hàng lên Backend
  createOrder: async (data: {
    receiverName: string;
    receiverPhone: string;
    shippingAddress: string;
    customerNote?: string;
    couponCode?: string;
    paymentMethod: string;
    items: { productId: number; variantId: number; quantity: number }[];
  }) => {
    const response = await api.post('/api/orders', data);
    return response.data;
  },

  // Lấy danh sách đơn hàng của user đang đăng nhập
  getMyOrders: async () => {
    const response = await api.get('/api/Orders/my-orders');
    return response.data;
  },

  // Cập nhật trạng thái đơn hàng ở backend
  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.put(`/api/Orders/${orderId}/status`, { status });
    return response.data;
  },

  // === MỚI: Lấy toàn bộ đơn hàng cho Admin/Sales/Kho ===
  getAllOrdersAdmin: async () => {
    const response = await api.get('/api/Orders/admin-all');
    return response.data;
  },

  // === MỚI: Xác nhận đơn (PENDING -> CONFIRMED) ===
  confirmOrder: async (orderId: string) => {
    const response = await api.put(`/api/Orders/${orderId}/confirm`);
    return response.data;
  },

  // === MỚI: Duyệt đơn bán -> Trừ tồn kho (CONFIRMED -> SHIPPING) ===
  approveOrder: async (orderId: string) => {
    const response = await api.put(`/api/Orders/${orderId}/approve`);
    return response.data;
  },

  // === MỚI: Kho xác nhận chuẩn bị hàng xong (SHIPPING -> DELIVERED) ===
  warehousePrepareOrder: async (orderId: string) => {
    const response = await api.put(`/api/Orders/${orderId}/warehouse-prepare`);
    return response.data;
  },

  // === MỚI: Hủy đơn bán (hoàn kho nếu đã trừ) ===
  cancelOrderAdmin: async (orderId: string, reason: string) => {
    const response = await api.put(`/api/Orders/${orderId}/cancel-admin`, { reason });
    return response.data;
  },

  // === MỚI: Xử lý khách trả hàng -> Kiểm tra tình trạng -> Hoàn kho nếu hợp lệ ===
  processReturn: async (orderId: string, isValidReturn: boolean, reason?: string) => {
    const response = await api.put(`/api/Orders/${orderId}/process-return`, {
      isValidReturn,
      reason,
    });
    return response.data;
  },
};

// ==========================================================================
// Shipment API
// ==========================================================================

export const shipmentApi = {
  // NHÂN VIÊN KHO — Xem danh sách đơn cần giao (SHIPPING hoặc DELIVERY_FAILED)
  getOrdersToDeliver: async () => {
    const response = await api.get('/api/Shipments/orders-to-deliver');
    return response.data;
  },

  // NHÂN VIÊN KHO — Tạo yêu cầu giao hàng + bàn giao cho đơn vị vận chuyển
  createShipment: async (orderId: number, carrierName: string) => {
    const response = await api.post(`/api/Shipments/${orderId}/create`, {
      carrierName,
    });
    return response.data;
  },

  // NHÂN VIÊN KHO — Theo dõi trạng thái giao hàng / xem lý do thất bại
  getShipmentsByOrder: async (orderId: number) => {
    const response = await api.get(`/api/Shipments/order/${orderId}`);
    return response.data;
  },

  // ĐƠN VỊ VẬN CHUYỂN — Xem các yêu cầu giao hàng đang chờ xử lý
  getPendingShipments: async () => {
    const response = await api.get('/api/Shipments/pending');
    return response.data;
  },

  // ĐƠN VỊ VẬN CHUYỂN — Tiếp nhận yêu cầu giao hàng
  receiveShipment: async (shipmentId: number) => {
    const response = await api.put(`/api/Shipments/${shipmentId}/receive`);
    return response.data;
  },

  // ĐƠN VỊ VẬN CHUYỂN — Cập nhật mã vận đơn
  updateTrackingCode: async (shipmentId: number, trackingCode: string) => {
    const response = await api.put(
      `/api/Shipments/${shipmentId}/tracking-code`,
      { trackingCode }
    );
    return response.data;
  },

  // ĐƠN VỊ VẬN CHUYỂN — Ghi nhận kết quả giao hàng (thành công / thất bại)
  recordDeliveryResult: async (
    shipmentId: number,
    success: boolean,
    failReason?: string
  ) => {
    const response = await api.put(
      `/api/Shipments/${shipmentId}/delivery-result`,
      {
        success,
        failReason,
      }
    );
    return response.data;
  },
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

export const promotionApi = {
  getAllAdmin: async () => {
    const response = await api.get('/api/Promotions/admin-all');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/api/Promotions', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/api/Promotions/${id}`, data);
    return response.data;
  },
  end: async (id: number) => {
    const response = await api.put(`/api/Promotions/${id}/end`);
    return response.data;
  },
};

export default api;