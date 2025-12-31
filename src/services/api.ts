import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'superadmin' | 'police' | 'hospital';
  profilePhoto?: string;
  hospitalPreference?: 'government' | 'private' | 'both';
  hospitalType?: 'government' | 'private'; // For hospital role users
  accidentAlerts?: boolean;
  smsNotifications?: boolean;
  locationTracking?: boolean;
  bloodGroup?: string;
  address?: string;
  medicalConditions?: string[];
  emergencyContacts?: Array<{
    name: string;
    relation: string;
    phone: string;
  }>;
  onDuty?: boolean; // For police/hospital role users
  specialization?: string; // For hospital role users
}

// ... existing interfaces ...

// export const adminAPI = {
//   ...
//   createUser: (data: { 
//     fullName: string; 
//     email: string; 
//     phone: string; 
//     password?: string;
//     bloodGroup?: string;
//     address?: string;
//     medicalConditions?: string[];
//     emergencyContacts?: Array<{ name: string; relation: string; phone: string }>;
//   }) => api.post('/admin/users', data),
//   ...
// }

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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

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
    }
  } catch (error) {
    // Silently handle token retrieval errors
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
  uploadProfilePhoto: (id: string, file: { uri: string; type: string; name: string }) => {
    const formData = new FormData();
    formData.append('photo', file as any);
    return api.post(`/users/${id}/profile-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
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
  getCombined: (source: 'all' | 'alert' | 'sos' = 'all') =>
    api.get('/alerts/combined', { params: { source } }),
  getCombinedStats: () => api.get('/alerts/stats/combined'),
  getByDevice: (deviceId: string) => api.get(`/alerts/device/${deviceId}`),
  getById: (id: string) => api.get(`/alerts/${id}`),
  create: (data: AlertData) => api.post('/alerts', data),
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.patch(`/alerts/${id}/status`, data),
  delete: (id: string, source: 'alert' | 'sos' = 'alert') =>
    api.delete(`/alerts/${id}`, { params: { source } }),
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
    isSOS?: boolean;
  }) => api.post('/device-locations/browser', data),

  // Record multiple locations in batch
  createBatch: (locations: Array<{
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
    isSOS?: boolean;
  }>) => api.post('/device-locations/batch', locations),

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

  // Get location statistics for a device
  getStats: (deviceId: string) => api.get(`/device-locations/device/${deviceId}/stats`),

  // Delete all locations for a device
  deleteByDevice: (deviceId: string) => api.delete(`/device-locations/device/${deviceId}`),
};

export const qrCodesAPI = {
  getAll: () => api.get('/qrcodes'),
  getAvailable: () => api.get('/qrcodes/available'),
  getStats: () => api.get('/qrcodes/stats'),
  validateCode: (code: string) => api.get(`/qrcodes/validate/${code}`),
  getById: (id: string) => api.get(`/qrcodes/${id}`),
  getImageUrl: (code: string) => `${API_BASE_URL}/qrcodes/image/${code}`,
  getImageUrlById: (id: string) => `${API_BASE_URL}/qrcodes/${id}/qr`,
  create: (data: { deviceCode: string; deviceName?: string }) =>
    api.post('/qrcodes/create', data),
  generateRandom: (count: number = 10) =>
    api.post('/qrcodes/generate', { count }),
  assign: (deviceCode: string, userId: string) =>
    api.post('/qrcodes/assign', { deviceCode, userId }),
  unassign: (code: string) => api.post(`/qrcodes/unassign/${code}`),
  delete: (id: string) => api.delete(`/qrcodes/${id}`),

  // Upload QR image by ID
  uploadImage: (deviceId: string, file: { uri: string; type: string; name: string }) => {
    const formData = new FormData();
    formData.append('deviceId', deviceId);
    formData.append('qrImage', file as any);
    return api.post('/qrcodes/upload-qr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Upload QR image by device code
  uploadImageByCode: (code: string, file: { uri: string; type: string; name: string }) => {
    const formData = new FormData();
    formData.append('qrImage', file as any);
    return api.post(`/qrcodes/upload-qr/${code}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export const adminAPI = {
  // Stats
  getStats: () => api.get('/admin/stats'),

  // Users Management
  getAllUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    api.get('/admin/users', { params }),
  getUserById: (userId: string) => api.get(`/admin/users/${userId}`),
  createUser: (data: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    bloodGroup?: string;
    address?: string;
    medicalConditions?: string[];
    emergencyContacts?: Array<{ name: string; relation: string; phone: string }>;
  }) => api.post('/admin/users', data),
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
  // Update profile (onDuty, etc)
  updateProfile: (data: { isActive?: boolean; onDuty?: boolean; fullName?: string }) =>
    api.patch('/police/profile', data),

  getStats: () => api.get('/police/stats'),
  getAllUsers: () => api.get('/police/users'),
  getAlerts: (params?: { status?: string; limit?: number }) =>
    api.get('/police/alerts', { params }),
  getAlertById: (alertId: string) => api.get(`/police/alerts/${alertId}`),
  updateAlertStatus: (alertId: string, status: string, notes?: string) =>
    api.patch(`/police/alerts/${alertId}`, { status, notes }),
  getAllAlerts: () => api.get('/police/alerts'),

  // Location tracking
  updateLocation: (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  }) => api.post('/police/location', data),

  getLocationHistory: () => api.get('/police/location/history'),
  getLastLocation: () => api.get('/police/location/last'),
};

export const hospitalAPI = {
  // Update profile (onDuty, etc)
  updateProfile: (data: { isActive?: boolean; onDuty?: boolean; fullName?: string }) =>
    api.patch('/hospital/profile', data),

  getStats: () => api.get('/hospital/stats'),
  getAllUsers: () => api.get('/hospital/users'),
  getAlerts: (params?: { status?: string; limit?: number }) =>
    api.get('/hospital/alerts', { params }),
  getAlertById: (alertId: string) => api.get(`/hospital/alerts/${alertId}`),
  updateAlertStatus: (alertId: string, status: string, notes?: string) =>
    api.patch(`/hospital/alerts/${alertId}`, { status, notes }),
  getAllAlerts: () => api.get('/hospital/alerts'),

  // Location tracking
  updateLocation: (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  }) => api.post('/hospital/location', data),

  getLocationHistory: () => api.get('/hospital/location/history'),
  getLastLocation: () => api.get('/hospital/location/last'),
};

// Health API (for monitoring)
export const healthAPI = {
  check: () => api.get('/health'),
  checkMqtt: () => api.get('/health/mqtt'),
  checkDetailed: () => api.get('/health/detailed'),
};

// SOS Types
export interface SosResponder {
  id: string;
  name: string;
  role: 'police' | 'hospital';
  phone: string;
  distance: number;
  distanceMeters: number;
  lastActiveLocation: {
    type: string;
    coordinates: [number, number];
  };
  onDuty: boolean;
  lastUpdated: Date;
}

export interface SosTriggerResponse {
  success: boolean;
  sosId: string;
  status: 'pending' | 'assigned' | 'no-responders' | 'resolved';
  message: string;
  victimLocation: {
    lat: number;
    lng: number;
  };
  responders: {
    police: SosResponder[];
    hospitals: SosResponder[];
    totalFound: number;
  };
}

// SOS API
export const sosAPI = {
  // Trigger SOS emergency - finds nearby police and hospitals
  trigger: (data: { lat: number; lng: number }) =>
    api.post<SosTriggerResponse>('/sos/trigger', data),

  // Get SOS results by ID
  getResults: (sosId: string) =>
    api.get(`/sos/results/${sosId}`),

  // Resolve SOS event
  resolve: (sosId: string, notes?: string) =>
    api.post(`/sos/resolve/${sosId}`, { notes }),

  // Get user's SOS history
  getHistory: () =>
    api.get('/sos/history'),

  // Get all active SOS events (admin/responder)
  getActive: () =>
    api.get('/sos/active'),

  // Respond to SOS event (police/hospital)
  respond: (sosId: string) =>
    api.post(`/sos/respond/${sosId}`),

  // Get responders info for an SOS event
  getResponders: (sosId: string) =>
    api.get(`/sos/responders/${sosId}`),
};

// On-Duty API (for police/hospital responders)
export const onDutyAPI = {
  // Update responder location when on duty
  updateLocation: (data: {
    lat: number;
    lng: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  }) => api.post('/on-duty/location', data),

  // Toggle on-duty status
  toggle: (data: { onDuty: boolean; lat?: number; lng?: number }) =>
    api.post('/on-duty/toggle', data),

  // Get current on-duty status
  getStatus: () =>
    api.get('/on-duty/status'),
};

// System Config API (superadmin only)
export interface SystemConfig {
  id: string;
  configKey: string;
  maxPoliceAlertRecipients: number;
  maxHospitalAlertRecipients: number;
  defaultSearchRadiusMeters: number;
  maxSearchRadiusMeters: number;
  lastUpdatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const systemConfigAPI = {
  // Get system configuration
  getConfig: () => api.get<SystemConfig>('/system-config'),

  // Get alert recipient limits
  getAlertLimits: () => api.get<{ maxPolice: number; maxHospital: number }>('/system-config/alert-limits'),

  // Update system configuration (superadmin only)
  updateConfig: (data: {
    maxPoliceAlertRecipients?: number;
    maxHospitalAlertRecipients?: number;
    defaultSearchRadiusMeters?: number;
    maxSearchRadiusMeters?: number;
  }) => api.patch<SystemConfig>('/system-config', data),
};

// Partners API
export const partnersAPI = {
  // Get all partner requests
  getAll: (status?: string) => api.get('/partners', { params: { status } }),

  // Get partner request stats
  getStats: () => api.get('/partners/stats'),

  // Get single partner request
  getById: (id: string) => api.get(`/partners/${id}`),

  // Update partner request status
  update: (id: string, data: { status?: string; reviewNotes?: string }) =>
    api.patch(`/partners/${id}`, data),

  // Delete partner request
  delete: (id: string) => api.delete(`/partners/${id}`),
};

export default api;
