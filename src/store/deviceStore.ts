import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { devicesAPI, DeviceData, EmergencyContact } from '../services/api';

interface DeviceState {
  devices: DeviceData[];
  currentDevice: DeviceData | null;
  isLoading: boolean;
  error: string | null;
  newDevice: {
    code: string;
    name: string;
    emergencyContacts: EmergencyContact[];
    insurance: {
      health: string;
      vehicle: string;
      term: string;
    };
  };
  setNewDeviceCode: (code: string) => void;
  setNewDeviceName: (name: string) => void;
  addEmergencyContact: (contact: EmergencyContact) => void;
  removeEmergencyContact: (index: number) => void;
  setInsurance: (field: 'health' | 'vehicle' | 'term', value: string) => void;
  resetNewDevice: () => void;
  fetchDevices: () => Promise<void>;
  fetchDevice: (id: string) => Promise<void>;
  createDevice: () => Promise<DeviceData>;
  updateDevice: (id: string, data: Partial<DeviceData>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
}

const initialNewDevice = {
  code: '',
  name: '',
  emergencyContacts: [],
  insurance: {
    health: '',
    vehicle: '',
    term: '',
  },
};

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  currentDevice: null,
  isLoading: false,
  error: null,
  newDevice: { ...initialNewDevice },

  setNewDeviceCode: (code: string) =>
    set((state) => ({ newDevice: { ...state.newDevice, code } })),

  setNewDeviceName: (name: string) =>
    set((state) => ({ newDevice: { ...state.newDevice, name } })),

  addEmergencyContact: (contact: EmergencyContact) =>
    set((state) => ({
      newDevice: {
        ...state.newDevice,
        emergencyContacts: [...state.newDevice.emergencyContacts, contact],
      },
    })),

  removeEmergencyContact: (index: number) =>
    set((state) => ({
      newDevice: {
        ...state.newDevice,
        emergencyContacts: state.newDevice.emergencyContacts.filter((_, i) => i !== index),
      },
    })),

  setInsurance: (field: 'health' | 'vehicle' | 'term', value: string) =>
    set((state) => ({
      newDevice: {
        ...state.newDevice,
        insurance: { ...state.newDevice.insurance, [field]: value },
      },
    })),

  resetNewDevice: () => set({ newDevice: { ...initialNewDevice } }),

  fetchDevices: async () => {
    // Check if auth token exists before making API call
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) {
      console.log('No auth token found, skipping device fetch');
      set({ isLoading: false, devices: [] });
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const response = await devicesAPI.getAll();
      console.log('Devices API response:', JSON.stringify(response.data, null, 2));
      // Handle different response formats
      const deviceData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.devices || response.data?.data || [];
      console.log('Parsed devices:', deviceData.length);
      set({ devices: deviceData, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch devices:', error.response?.data || error.message);
      set({ error: error.message, isLoading: false, devices: [] });
    }
  },

  fetchDevice: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await devicesAPI.getOne(id);
      set({ currentDevice: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createDevice: async () => {
    set({ isLoading: true, error: null });
    try {
      const { newDevice } = get();
      const response = await devicesAPI.create({
        code: newDevice.code,
        name: newDevice.name,
        emergencyContacts: newDevice.emergencyContacts,
        insurance: newDevice.insurance,
      });
      set((state) => ({
        devices: [...state.devices, response.data],
        isLoading: false,
      }));
      get().resetNewDevice();
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateDevice: async (id: string, data: Partial<DeviceData>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await devicesAPI.update(id, data);
      set((state) => ({
        devices: state.devices.map((d) => (d._id === id ? response.data : d)),
        currentDevice: state.currentDevice?._id === id ? response.data : state.currentDevice,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteDevice: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await devicesAPI.delete(id);
      set((state) => ({
        devices: state.devices.filter((d) => d._id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
