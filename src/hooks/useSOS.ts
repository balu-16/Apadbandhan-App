import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { sosAPI, SosTriggerResponse, SosResponder } from '../services/api';

interface UseSosReturn {
  triggerSos: () => Promise<SosTriggerResponse | null>;
  isTriggering: boolean;
  error: string | null;
  sosResult: SosTriggerResponse | null;
  clearSos: () => void;
}

export const useSOS = (): UseSosReturn => {
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sosResult, setSosResult] = useState<SosTriggerResponse | null>(null);

  const triggerSos = useCallback(async (): Promise<SosTriggerResponse | null> => {
    setIsTriggering(true);
    setError(null);

    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied. Please enable location to use SOS.');
      }

      // Get current position with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      console.log(`[SOS] Triggering at location: ${latitude}, ${longitude}`);

      // Call SOS API
      const response = await sosAPI.trigger({
        lat: latitude,
        lng: longitude,
      });

      const result = response.data;
      setSosResult(result);
      
      console.log(`[SOS] Result: ${result.status} - Found ${result.responders.totalFound} responders`);
      
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to trigger SOS';
      setError(errorMessage);
      console.error('[SOS] Error:', errorMessage);
      return null;
    } finally {
      setIsTriggering(false);
    }
  }, []);

  const clearSos = useCallback(() => {
    setSosResult(null);
    setError(null);
  }, []);

  return {
    triggerSos,
    isTriggering,
    error,
    sosResult,
    clearSos,
  };
};

export default useSOS;
