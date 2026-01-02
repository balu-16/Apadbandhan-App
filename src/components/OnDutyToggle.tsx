import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useOnDutyTracking } from '../hooks/useOnDutyTracking';
import { useTheme } from '../hooks/useTheme';

interface OnDutyToggleProps {
  role: 'police' | 'hospital';
  style?: object;
}

const OnDutyToggle: React.FC<OnDutyToggleProps> = ({ role, style }) => {
  const { isOnDuty, toggleOnDuty, isLoading, error, lastLocation, lastUpdate } = useOnDutyTracking();
  const { colors, isDark } = useTheme();

  const roleColor = role === 'police' ? '#3b82f6' : '#ef4444';
  const roleLabel = role === 'police' ? 'Police' : 'Hospital';

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
      },
      style
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.roleIcon, { backgroundColor: roleColor }]}>
          {role === 'police' ? (
            <MaterialIcons name="local-police" size={20} color="#fff" />
          ) : (
            <MaterialIcons name="local-hospital" size={20} color="#fff" />
          )}
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{roleLabel} Duty Status</Text>
      </View>

      {/* Toggle Button */}
      <TouchableOpacity
        style={[
          styles.toggleButton,
          { backgroundColor: isOnDuty ? '#22c55e' : (isDark ? '#374151' : '#e5e7eb') }
        ]}
        onPress={toggleOnDuty}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isOnDuty ? '#fff' : colors.textSecondary} />
        ) : (
          <>
            <MaterialIcons 
              name={isOnDuty ? "toggle-on" : "toggle-off"} 
              size={32} 
              color={isOnDuty ? '#fff' : colors.textSecondary} 
            />
            <Text style={[
              styles.toggleText,
              { color: isOnDuty ? '#fff' : colors.textSecondary }
            ]}>
              {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
            </Text>
          </>
        )}
      </TouchableOpacity>


      {/* Status Info */}
      {isOnDuty && (
        <View style={[styles.statusInfo, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4' }]}>
          <View style={styles.statusRow}>
            <MaterialIcons name="my-location" size={16} color="#22c55e" />
            <Text style={[styles.statusText, { color: colors.text }]}>
              Location tracking active
            </Text>
          </View>
          
          {lastLocation && (
            <View style={styles.statusRow}>
              <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                {lastLocation.lat.toFixed(4)}, {lastLocation.lng.toFixed(4)}
              </Text>
            </View>
          )}
          
          {lastUpdate && (
            <View style={styles.statusRow}>
              <MaterialIcons name="access-time" size={16} color={colors.textSecondary} />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                Last update: {formatTime(lastUpdate)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2' }]}>
          <MaterialIcons name="error-outline" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Info */}
      <Text style={[styles.infoText, { color: colors.textTertiary }]}>
        {isOnDuty 
          ? 'Your location is being shared every 30 seconds when you move 50+ meters.'
          : 'Go on duty to start sharing your location for emergency response.'
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusInfo: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default OnDutyToggle;
