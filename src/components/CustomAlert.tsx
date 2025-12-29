import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export function CustomAlert({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onDismiss,
  icon,
  iconColor,
}: CustomAlertProps) {
  const { colors, isDark } = useTheme();

  const getButtonStyle = (style?: 'default' | 'cancel' | 'destructive') => {
    switch (style) {
      case 'destructive':
        return { backgroundColor: '#ef4444', textColor: '#fff' };
      case 'cancel':
        return { backgroundColor: isDark ? '#374151' : '#f3f4f6', textColor: colors.text };
      default:
        return { backgroundColor: '#6366f1', textColor: '#fff' };
    }
  };

  const getIconColor = () => {
    if (iconColor) return iconColor;
    if (icon === 'warning' || icon === 'alert-circle') return '#f59e0b';
    if (icon === 'checkmark-circle') return '#10b981';
    if (icon === 'close-circle' || icon === 'trash') return '#ef4444';
    return '#6366f1';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={[styles.alertContainer, { backgroundColor: colors.surface }]}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: `${getIconColor()}15` }]}>
              <Ionicons name={icon} size={32} color={getIconColor()} />
            </View>
          )}
          
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          
          {message && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          )}
          
          <View style={[styles.buttonContainer, buttons.length === 1 && styles.singleButton]}>
            {buttons.map((button, index) => {
              const buttonStyle = getButtonStyle(button.style);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    { backgroundColor: buttonStyle.backgroundColor },
                    buttons.length === 2 && styles.halfButton,
                  ]}
                  onPress={() => {
                    button.onPress?.();
                    onDismiss?.();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.buttonText, { color: buttonStyle.textColor }]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  alertContainer: {
    width: SCREEN_WIDTH - 60,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  singleButton: {
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  halfButton: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomAlert;
