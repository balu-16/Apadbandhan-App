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

const MIN_DISTANCE_METERS = 50; // Minimum distance to trigger location update

// Convert speed from m/s (GPS raw) to km/h for storage/display
const convertSpeedToKmh = (speedMs: number | null | undefined): number | undefined => {
  if (speedMs === null || speedMs === undefined || speedMs < 0) return undefined;
  return Math.round(speedMs * 3.6 * 10) / 10; // Convert m/s to km/h, round to 1 decimal
};

// Haversine formula to calculate distance between two coordinates
const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export function useLocationTracking() {
  const { isAuthenticated, token } = useAuthStore();
  const { devices, fetchDevices } = useDeviceStore();
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const appState = useRef(AppState.currentState);
  const lastSentLocationRef = useRef<{ [deviceId: string]: { lat: number; lng: number } }>({});

  const updateDeviceLocations = useCallback(async (location: LocationData) => {
    if (!isAuthenticated || !token || devices.length === 0) return;

    try {
      // Update location for all user's devices (only if moved >= 50m)
      const updatePromises = devices.map(async (device) => {
        if (!device._id) return;
        
        // Check if device has moved at least MIN_DISTANCE_METERS from last sent location
        const lastSent = lastSentLocationRef.current[device._id];
        if (lastSent) {
          const distance = calculateDistanceMeters(
            lastSent.lat,
            lastSent.lng,
            location.latitude,
            location.longitude
          );
          
          if (distance < MIN_DISTANCE_METERS) {
            console.log(`[Location] Skipping ${device.name || device._id}: moved only ${Math.round(distance)}m (min: ${MIN_DISTANCE_METERS}m)`);
            return;
          }
        }
        
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
          
          // Update last sent location for this device
          lastSentLocationRef.current[device._id] = {
            lat: location.latitude,
            lng: location.longitude,
          };
          
          console.log(`[Location] Updated for device: ${device.name || device._id}`);
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
        speed: convertSpeedToKmh(currentLocation.coords.speed), // Convert m/s to km/h
        heading: currentLocation.coords.heading || undefined,
        accuracy: currentLocation.coords.accuracy || undefined,
      };

      // Update all devices with current location
      await updateDeviceLocations(locationData);

      return locationData;
    } catch (error: any) {
      // Silently handle location unavailable errors (common in emulators/dev)
      if (error?.message?.includes('location') || error?.code === 'E_LOCATION_UNAVAILABLE') {
        console.log('Location services unavailable - skipping location update');
      } else {
        console.error('Error getting location:', error);
      }
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

      // Start watching location with updates every 10 seconds or 50 meters
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 50, // 50 meters
        },
        async (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude || undefined,
            speed: convertSpeedToKmh(location.coords.speed), // Convert m/s to km/h
            heading: location.coords.heading || undefined,
            accuracy: location.coords.accuracy || undefined,
          };
          await updateDeviceLocations(locationData);
        }
      );
    } catch (error: any) {
      // Silently handle location unavailable errors (common in emulators/dev)
      if (error?.message?.includes('location') || error?.code === 'E_LOCATION_UNAVAILABLE') {
        console.log('Location tracking unavailable - will retry when available');
      } else {
        console.error('Error starting location tracking:', error);
      }
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
