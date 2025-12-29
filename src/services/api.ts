import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'superadmin' | 'police' | 'hospital';
  profilePhoto?: string;
  hospitalPreference?: string;
  accidentAlerts?: boolean;
  smsNotifications?: boolean;
  locationTracking?: boolean;
}

export interface DeviceData {
  _id?: string;
  name?: string;
  code?: string;
  type?: string;
  status?: 'online' | 'offline';
  emergencyContacts?: Array<{
    name: string;
    relation: string;
    phone: string;
    isActive?: boolean;
  }>;
  insurance?: {
    health?: string;
    vehicle?: string;
    term?: string;
  };
}

export interface AlertData {
  deviceId: string;
  type: string;
  severity?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  isActive?: boolean;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://apadbandhan-backend.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request:', config.method?.toUpperCase(), config.url, '(Auth token attached)');
    } else {
      console.warn('API Request:', config.method?.toUpperCase(), config.url, '(No auth token!)');
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  signup: (data: { phone: string; otp: string; fullName: string; email: string }) =>
    api.post('/auth/signup', data),
  getProfile: () => api.get('/auth/me'),
};

export const usersAPI = {
  getProfile: (id: string) => api.get(`/users/${id}`),
  updateProfile: (id: string, data: Partial<UserProfile>) => api.patch(`/users/${id}`, data),
  deleteAccount: (id: string) => api.delete(`/users/${id}`),
};

export const devicesAPI = {
  getAll: () => api.get('/devices'),
  getOne: (id: string) => api.get(`/devices/${id}`),
  create: (data: DeviceData) => api.post('/devices', data),
  update: (id: string, data: Partial<DeviceData>) => api.patch(`/devices/${id}`, data),
  delete: (id: string) => api.delete(`/devices/${id}`),
  updateLocation: (id: string, data: { latitude: number; longitude: number; address?: string }) =>
    api.patch(`/devices/${id}/location`, data),
  updateStatus: (id: string, status: 'online' | 'offline' | 'maintenance') =>
    api.patch(`/devices/${id}/status/${status}`),
};

export const alertsAPI = {
  getAll: (params?: { status?: string; limit?: number; skip?: number }) =>
    api.get('/alerts', { params }),
  getStats: () => api.get('/alerts/stats'),
  getByDevice: (deviceId: string) => api.get(`/alerts/device/${deviceId}`),
  getById: (id: string) => api.get(`/alerts/${id}`),
  create: (data: AlertData) => api.post('/alerts', data),
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.patch(`/alerts/${id}/status`, data),
};

export const deviceLocationsAPI = {
  create: (data: {
    deviceId: string;
    latitude: number;
    longitude: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    source?: string;
  }) => api.post('/device-locations/browser', data),
  getByDevice: (
    deviceId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
      skip?: number;
    }
  ) => api.get(`/device-locations/device/${deviceId}`, { params }),
  getLatest: (deviceId: string) => api.get(`/device-locations/device/${deviceId}/latest`),
};

export const qrCodesAPI = {
  getAll: () => api.get('/qrcodes'),
  getAvailable: () => api.get('/qrcodes/available'),
  getStats: () => api.get('/qrcodes/stats'),
  validateCode: (code: string) => api.get(`/qrcodes/validate/${code}`),
  getById: (id: string) => api.get(`/qrcodes/${id}`),
  getImageUrl: (code: string) => `${API_BASE_URL}/qrcodes/image/${code}`,
  create: (data: { deviceCode: string; deviceName?: string }) =>
    api.post('/qrcodes/create', data),
  generateRandom: (count: number = 10) =>
    api.post('/qrcodes/generate', { count }),
  assign: (deviceCode: string, userId: string) =>
    api.post('/qrcodes/assign', { deviceCode, userId }),
  unassign: (code: string) => api.post(`/qrcodes/unassign/${code}`),
  delete: (id: string) => api.delete(`/qrcodes/${id}`),
};

export const adminAPI = {
  // Stats
  getStats: () => api.get('/admin/stats'),
  
  // Users Management
  getAllUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    api.get('/admin/users', { params }),
  getUserById: (userId: string) => api.get(`/admin/users/${userId}`),
  createUser: (data: { fullName: string; email: string; phone: string; password?: string }) =>
    api.post('/admin/users', data),
  updateUser: (userId: string, data: Partial<UserProfile>) =>
    api.patch(`/admin/users/${userId}`, data),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
  getUserLoginLogs: (userId: string) => api.get(`/admin/users/${userId}/login-logs`),
  
  // Admins Management (superadmin only)
  getAllAdmins: () => api.get('/admin/admins'),
  createAdmin: (data: { fullName: string; email: string; phone: string; password: string }) =>
    api.post('/admin/admins', data),
  deleteAdmin: (adminId: string) => api.delete(`/admin/admins/${adminId}`),
  getAdminLoginLogs: (adminId: string) => api.get(`/admin/admins/${adminId}/login-logs`),
  
  // Police Users Management (superadmin only)
  getAllPoliceUsers: () => api.get('/admin/police-users'),
  createPoliceUser: (data: { fullName: string; email: string; phone: string; password: string; badgeNumber?: string; station?: string }) =>
    api.post('/admin/police-users', data),
  deletePoliceUser: (userId: string) => api.delete(`/admin/police-users/${userId}`),
  
  // Hospital Users Management (superadmin only)
  getAllHospitalUsers: () => api.get('/admin/hospital-users'),
  createHospitalUser: (data: { fullName: string; email: string; phone: string; password: string; hospitalName?: string; department?: string }) =>
    api.post('/admin/hospital-users', data),
  deleteHospitalUser: (userId: string) => api.delete(`/admin/hospital-users/${userId}`),
  
  // Devices Management
  getAllDevices: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/devices', { params }),
  getDeviceById: (deviceId: string) => api.get(`/admin/devices/${deviceId}`),
  
  // QR Codes Management
  getAllQRCodes: () => api.get('/admin/devices/qrcodes'),
  generateQRCodes: (count: number) => api.post('/admin/devices/generate', { count }),
  deleteQRCode: (qrId: string) => api.delete(`/qrcodes/${qrId}`),
  getQRCodeStats: () => api.get('/admin/devices/qrcodes/stats'),
};

export const policeAPI = {
  getStats: () => api.get('/police/stats'),
  getAllUsers: () => api.get('/police/users'),
  getAlerts: (params?: { status?: string; limit?: number }) =>
    api.get('/police/alerts', { params }),
  getAlertById: (alertId: string) => api.get(`/police/alerts/${alertId}`),
  updateAlertStatus: (alertId: string, status: string, notes?: string) =>
    api.patch(`/police/alerts/${alertId}`, { status, notes }),
  getAllAlerts: () => api.get('/police/alerts'),
};

export const hospitalAPI = {
  getStats: () => api.get('/hospital/stats'),
  getAllUsers: () => api.get('/hospital/users'),
  getAlerts: (params?: { status?: string; limit?: number }) =>
    api.get('/hospital/alerts', { params }),
  getAlertById: (alertId: string) => api.get(`/hospital/alerts/${alertId}`),
  updateAlertStatus: (alertId: string, status: string, notes?: string) =>
    api.patch(`/hospital/alerts/${alertId}`, { status, notes }),
  getAllAlerts: () => api.get('/hospital/alerts'),
};

// Health API (for monitoring)
export const healthAPI = {
  check: () => api.get('/health'),
  checkMqtt: () => api.get('/health/mqtt'),
  checkDetailed: () => api.get('/health/detailed'),
};

export default api;
