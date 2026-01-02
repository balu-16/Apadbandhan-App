import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { onDutyAPI } from '../services/api';

interface UseOnDutyTrackingReturn {
  isOnDuty: boolean;
  toggleOnDuty: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  lastLocation: { lat: number; lng: number } | null;
  lastUpdate: Date | null;
}

const LOCATION_UPDATE_INTERVAL = 30000; // 30 seconds
const MIN_DISTANCE_METERS = 50; // 50 meters minimum movement

// Convert speed from m/s (GPS raw) to km/h for storage/display
const convertSpeedToKmh = (speedMs: number | null | undefined): number | undefined => {
  if (speedMs === null || speedMs === undefined || speedMs < 0) return undefined;
  return Math.round(speedMs * 3.6 * 10) / 10; // Convert m/s to km/h, round to 1 decimal
};

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (
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

export const useOnDutyTracking = (): UseOnDutyTrackingReturn => {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSentLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Update location to backend
  const updateLocationToBackend = useCallback(async () => {
    if (!isOnDuty) return;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude, accuracy, altitude, speed, heading } = location.coords;
      
      // Check if moved at least MIN_DISTANCE_METERS from last sent location
      if (lastSentLocationRef.current) {
        const distance = calculateDistance(
          lastSentLocationRef.current.lat,
          lastSentLocationRef.current.lng,
          latitude,
          longitude
        );
        
        if (distance < MIN_DISTANCE_METERS) {
          console.log(`[OnDuty] Skipping update - moved only ${Math.round(distance)}m (min: ${MIN_DISTANCE_METERS}m)`);
          return;
        }
      }

      // Send location to backend (convert speed from m/s to km/h)
      await onDutyAPI.updateLocation({
        lat: latitude,
        lng: longitude,
        accuracy: accuracy || undefined,
        altitude: altitude || undefined,
        speed: convertSpeedToKmh(speed), // Convert m/s to km/h
        heading: heading || undefined,
      });

      lastSentLocationRef.current = { lat: latitude, lng: longitude };
      setLastLocation({ lat: latitude, lng: longitude });
      setLastUpdate(new Date());
      
      console.log(`[OnDuty] Location updated: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    } catch (err: any) {
      console.error('[OnDuty] Error updating location:', err.message);
    }
  }, [isOnDuty]);

  // Start/stop location tracking based on isOnDuty
  useEffect(() => {
    if (isOnDuty) {
      // Update immediately
      updateLocationToBackend();
      
      // Set up interval for periodic updates
      intervalRef.current = setInterval(updateLocationToBackend, LOCATION_UPDATE_INTERVAL);
      console.log(`[OnDuty] Started location tracking (every ${LOCATION_UPDATE_INTERVAL / 1000}s)`);
    } else {
      // Clear interval when going off duty
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('[OnDuty] Stopped location tracking');
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOnDuty, updateLocationToBackend]);

  // Toggle on-duty status
  const toggleOnDuty = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const newStatus = !isOnDuty;
      
      // If going on duty, get current location first
      let location: { lat: number; lng: number } | undefined;
      
      if (newStatus) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission required to go on duty');
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        location = {
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
        };
      }

      // Call API to toggle status
      await onDutyAPI.toggle({
        onDuty: newStatus,
        lat: location?.lat,
        lng: location?.lng,
      });

      setIsOnDuty(newStatus);
      
      if (newStatus && location) {
        lastSentLocationRef.current = location;
        setLastLocation(location);
        setLastUpdate(new Date());
      }

      console.log(`[OnDuty] Status changed to: ${newStatus ? 'ON DUTY' : 'OFF DUTY'}`);
      return newStatus;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to toggle on-duty status';
      setError(errorMessage);
      console.error('[OnDuty] Error:', errorMessage);
      return isOnDuty;
    } finally {
      setIsLoading(false);
    }
  }, [isOnDuty]);

  return {
    isOnDuty,
    toggleOnDuty,
    isLoading,
    error,
    lastLocation,
    lastUpdate,
  };
};

export default useOnDutyTracking;
