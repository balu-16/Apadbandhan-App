import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useDeviceStore } from '../store/deviceStore';
import { deviceLocationsAPI } from '../services/api';

interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export function useLocationTracking() {
  const { isAuthenticated, token } = useAuthStore();
  const { devices, fetchDevices } = useDeviceStore();
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const appState = useRef(AppState.currentState);

  const updateDeviceLocations = useCallback(async (location: LocationData) => {
    if (!isAuthenticated || !token || devices.length === 0) return;

    try {
      // Update location for all user's devices
      const updatePromises = devices.map(async (device) => {
        if (!device._id) return;
        
        try {
          await deviceLocationsAPI.create({
            deviceId: device._id,
            latitude: location.latitude,
            longitude: location.longitude,
            altitude: location.altitude,
            speed: location.speed || undefined,
            heading: location.heading || undefined,
            accuracy: location.accuracy,
            source: 'gps',
          });
          console.log(`Location updated for device: ${device.name || device._id}`);
        } catch (error) {
          console.error(`Failed to update location for device ${device._id}:`, error);
        }
      });

      await Promise.allSettled(updatePromises);
    } catch (error) {
      console.error('Error updating device locations:', error);
    }
  }, [isAuthenticated, token, devices]);

  const requestPermissionAndGetLocation = useCallback(async () => {
    try {
      // Request foreground permission
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to track your devices and receive accurate emergency alerts. Go to Settings > Privacy > Location Services to enable.',
          [{ text: 'OK' }]
        );
        return null;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        altitude: currentLocation.coords.altitude || undefined,
        speed: currentLocation.coords.speed || undefined,
        heading: currentLocation.coords.heading || undefined,
        accuracy: currentLocation.coords.accuracy || undefined,
      };

      // Update all devices with current location
      await updateDeviceLocations(locationData);

      return locationData;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }, [updateDeviceLocations]);

  const startLocationTracking = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Stop any existing subscription
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      // Start watching location with updates every 30 seconds or 100 meters
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 100, // 100 meters
        },
        async (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude || undefined,
            speed: location.coords.speed || undefined,
            heading: location.coords.heading || undefined,
            accuracy: location.coords.accuracy || undefined,
          };
          await updateDeviceLocations(locationData);
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  }, [updateDeviceLocations]);

  const stopLocationTracking = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - update location
        if (isAuthenticated && devices.length > 0) {
          requestPermissionAndGetLocation();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, devices.length, requestPermissionAndGetLocation]);

  // Initialize location tracking when authenticated
  useEffect(() => {
    if (isAuthenticated && token && devices.length > 0) {
      requestPermissionAndGetLocation();
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => stopLocationTracking();
  }, [isAuthenticated, token, devices.length]);

  return {
    requestPermissionAndGetLocation,
    startLocationTracking,
    stopLocationTracking,
    updateDeviceLocations,
  };
}

export default useLocationTracking;
