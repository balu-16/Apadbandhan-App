import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { deviceLocationsAPI } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LocationHistory {
  _id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  speed?: number;
  heading?: number;
  recordedAt: string;
  isSOS?: boolean;
}

interface DeviceMapViewProps {
  deviceId: string;
  deviceName: string;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  isOnline?: boolean;
  onClose?: () => void;
}

const LOCATION_REFRESH_INTERVAL = 20000;

export function DeviceMapView({
  deviceId,
  deviceName,
  initialLocation,
  isOnline = false,
  onClose,
}: DeviceMapViewProps) {
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'history'>('map');
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasLocationHistory = locationHistory.length > 0;

  const centerLat = hasLocationHistory
    ? locationHistory[locationHistory.length - 1].latitude
    : initialLocation?.latitude || 20.5937;
  const centerLng = hasLocationHistory
    ? locationHistory[locationHistory.length - 1].longitude
    : initialLocation?.longitude || 78.9629;

  const routeCoordinates = locationHistory.map((loc) => ({
    latitude: loc.latitude,
    longitude: loc.longitude,
  }));

  const fetchLocationHistory = useCallback(
    async (isInitialLoad = false) => {
      if (!deviceId) return;

      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await deviceLocationsAPI.getByDevice(deviceId);

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const sortedLocations = response.data.sort(
            (a: LocationHistory, b: LocationHistory) =>
              new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
          );
          setLocationHistory(sortedLocations);

          if (mapRef.current && sortedLocations.length > 1) {
            const coordinates = sortedLocations.map((loc: LocationHistory) => ({
              latitude: loc.latitude,
              longitude: loc.longitude,
            }));
            mapRef.current.fitToCoordinates(coordinates, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }
        } else {
          setLocationHistory([]);
        }
        setLastRefreshTime(new Date());
      } catch (error: any) {
        console.error('Failed to fetch location history:', error.response?.data || error.message);
        if (isInitialLoad) {
          setLocationHistory([]);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [deviceId]
  );

  useEffect(() => {
    fetchLocationHistory(true);

    if (isOnline) {
      refreshIntervalRef.current = setInterval(() => {
        fetchLocationHistory(false);
      }, LOCATION_REFRESH_INTERVAL);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [deviceId, isOnline, fetchLocationHistory]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleManualRefresh = () => {
    fetchLocationHistory(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.deviceIcon, { backgroundColor: isOnline ? '#22c55e20' : '#ef444420' }]}>
            <Ionicons name="location" size={20} color={isOnline ? '#22c55e' : '#ef4444'} />
          </View>
          <View>
            <Text style={[styles.deviceName, { color: colors.text }]}>{deviceName}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22c55e' : '#ef4444' }]} />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: colors.background }]}
            onPress={handleManualRefresh}
            disabled={isRefreshing}
          >
            <Ionicons name="refresh" size={18} color={isRefreshing ? colors.textTertiary : colors.primary} />
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.background }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Buttons */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'map' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('map')}
        >
          <Ionicons name="map" size={18} color={activeTab === 'map' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.tabButtonText, { color: activeTab === 'map' ? '#fff' : colors.textSecondary }]}>
            Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons name="time" size={18} color={activeTab === 'history' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.tabButtonText, { color: activeTab === 'history' ? '#fff' : colors.textSecondary }]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map Tab */}
      {activeTab === 'map' && (
        <View style={styles.mapContainer}>
          {isLoading ? (
            <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading location data...</Text>
            </View>
          ) : (
            <>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: centerLat,
                  longitude: centerLng,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={true}
                mapType="standard"
              >
                {locationHistory.length > 1 && (
                  <Polyline coordinates={routeCoordinates} strokeColor="#3b82f6" strokeWidth={4} lineDashPattern={[10, 5]} />
                )}

                {locationHistory.length > 0 && (
                  <Marker
                    coordinate={{ latitude: locationHistory[0].latitude, longitude: locationHistory[0].longitude }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    title="Start Point"
                    description={`${formatTime(locationHistory[0].recordedAt)} - ${locationHistory[0].city || 'Unknown'}`}
                  >
                    <View style={styles.startMarker}>
                      <View style={styles.startMarkerInner} />
                    </View>
                  </Marker>
                )}

                {locationHistory.length > 2 &&
                  locationHistory.slice(1, -1).map((loc, index) => (
                    <Marker
                      key={loc._id}
                      coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                      anchor={{ x: 0.5, y: 0.5 }}
                      title={loc.isSOS ? '🚨 SOS Alert' : `Waypoint ${index + 1}`}
                      description={`${formatTime(loc.recordedAt)}${loc.speed ? ` - ${loc.speed} km/h` : ''}`}
                    >
                      <View style={loc.isSOS ? styles.sosMarker : styles.waypointMarker}>
                        <View style={loc.isSOS ? styles.sosMarkerInner : styles.waypointMarkerInner} />
                      </View>
                    </Marker>
                  ))}

                {locationHistory.length > 1 && (
                  <Marker
                    coordinate={{
                      latitude: locationHistory[locationHistory.length - 1].latitude,
                      longitude: locationHistory[locationHistory.length - 1].longitude,
                    }}
                    anchor={{ x: 0.5, y: 1 }}
                    title="Current Location"
                    description={`${formatTime(locationHistory[locationHistory.length - 1].recordedAt)}`}
                  >
                    <View style={styles.endMarker}>
                      <View style={styles.endMarkerArrow} />
                    </View>
                  </Marker>
                )}

                {locationHistory.length === 1 && (
                  <Marker
                    coordinate={{ latitude: locationHistory[0].latitude, longitude: locationHistory[0].longitude }}
                    title={deviceName}
                    description={locationHistory[0].city || 'Current Location'}
                  >
                    <View style={styles.singleMarker}>
                      <Ionicons name="location" size={32} color="#3b82f6" />
                    </View>
                  </Marker>
                )}

                {locationHistory.length === 0 && initialLocation && (
                  <Marker
                    coordinate={{ latitude: initialLocation.latitude, longitude: initialLocation.longitude }}
                    title={deviceName}
                    description="Last known location"
                  >
                    <View style={styles.singleMarker}>
                      <Ionicons name="location" size={32} color="#6b7280" />
                    </View>
                  </Marker>
                )}
              </MapView>

              {/* Legend */}
              {locationHistory.length > 1 && (
                <View style={[styles.legend, { backgroundColor: colors.surface }]}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Start</Text>
                  </View>
                  {locationHistory.length > 2 && (
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>Waypoints</Text>
                    </View>
                  )}
                  {locationHistory.some(loc => loc.isSOS) && (
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>SOS</Text>
                    </View>
                  )}
                  <View style={styles.legendItem}>
                    <View style={styles.legendArrow} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Current</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={styles.legendRoute} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Route</Text>
                  </View>
                </View>
              )}

              {/* Info bar */}
              <View style={[styles.infoBar, { backgroundColor: colors.surface }]}>
                <Ionicons name="navigate" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>{locationHistory.length} location points</Text>
                {isOnline && (
                  <View style={styles.autoRefreshBadge}>
                    <Ionicons name="sync" size={12} color="#22c55e" />
                    <Text style={styles.autoRefreshText}>Auto-refresh: 20s</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <View style={styles.historyContainer}>
          {isLoading ? (
            <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading history...</Text>
            </View>
          ) : locationHistory.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="location-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Location History</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Location data will appear here when the device starts tracking.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.historyList} contentContainerStyle={styles.historyListContent}>
              <View style={[styles.historyHeader, { backgroundColor: colors.surface }]}>
                <Text style={[styles.historyHeaderText, { color: colors.text }]}>
                  {locationHistory.length} Location Points
                </Text>
                {lastRefreshTime && (
                  <Text style={[styles.historyHeaderSubtext, { color: colors.textSecondary }]}>
                    Updated: {lastRefreshTime.toLocaleTimeString()}
                  </Text>
                )}
              </View>

              {[...locationHistory].reverse().map((loc, index) => {
                const isFirst = index === 0;
                const isLast = index === locationHistory.length - 1;
                return (
                  <View
                    key={loc._id}
                    style={[
                      styles.historyItem,
                      { backgroundColor: colors.surface, borderLeftColor: isFirst ? '#ef4444' : isLast ? '#22c55e' : '#3b82f6' },
                    ]}
                  >
                    <View style={styles.historyItemHeader}>
                      <View style={styles.historyItemIcon}>
                        <Ionicons
                          name={isFirst ? 'flag' : isLast ? 'play' : 'ellipse'}
                          size={isFirst || isLast ? 16 : 10}
                          color={isFirst ? '#ef4444' : isLast ? '#22c55e' : '#3b82f6'}
                        />
                      </View>
                      <Text style={[styles.historyItemLabel, { color: colors.text }]}>
                        {isFirst ? 'Current Location' : isLast ? 'Start Point' : `Waypoint ${locationHistory.length - index - 1}`}
                      </Text>
                      <Text style={[styles.historyItemTime, { color: colors.textSecondary }]}>{formatDate(loc.recordedAt)}</Text>
                    </View>
                    <View style={styles.historyItemBody}>
                      <View style={styles.historyCoords}>
                        <Text style={[styles.historyCoordLabel, { color: colors.textSecondary }]}>Lat:</Text>
                        <Text style={[styles.historyCoordValue, { color: colors.text }]}>{loc.latitude.toFixed(6)}</Text>
                      </View>
                      <View style={styles.historyCoords}>
                        <Text style={[styles.historyCoordLabel, { color: colors.textSecondary }]}>Lng:</Text>
                        <Text style={[styles.historyCoordValue, { color: colors.text }]}>{loc.longitude.toFixed(6)}</Text>
                      </View>
                      {loc.city && (
                        <View style={styles.historyCoords}>
                          <Text style={[styles.historyCoordLabel, { color: colors.textSecondary }]}>City:</Text>
                          <Text style={[styles.historyCoordValue, { color: colors.text }]}>{loc.city}</Text>
                        </View>
                      )}
                      {loc.speed !== undefined && loc.speed > 0 && (
                        <View style={styles.historyCoords}>
                          <Text style={[styles.historyCoordLabel, { color: colors.textSecondary }]}>Speed:</Text>
                          <Text style={[styles.historyCoordValue, { color: colors.text }]}>{loc.speed} km/h</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  startMarker: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startMarkerInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#fff',
  },
  waypointMarker: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waypointMarkerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#fff',
  },
  sosMarker: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosMarkerInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    borderWidth: 3,
    borderColor: '#fff',
  },
  endMarker: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endMarkerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ef4444',
  },
  singleMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  legendArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ef4444',
  },
  legendRoute: {
    width: 24,
    height: 3,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  autoRefreshBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  autoRefreshText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#22c55e',
  },
  historyContainer: {
    flex: 1,
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    padding: 16,
    gap: 12,
  },
  historyHeader: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyHeaderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  historyHeaderSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  historyItem: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyItemIcon: {
    marginRight: 8,
  },
  historyItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  historyItemTime: {
    fontSize: 11,
  },
  historyItemBody: {
    gap: 6,
  },
  historyCoords: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyCoordLabel: {
    fontSize: 12,
    width: 40,
  },
  historyCoordValue: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default DeviceMapView;
