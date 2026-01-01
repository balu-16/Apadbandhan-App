import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface ListFooterProps {
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  dataLength: number;
  primaryColor?: string;
  textColor?: string;
}

export function ListFooter({
  isFetchingNextPage,
  hasNextPage,
  dataLength,
  primaryColor = '#ff6600',
  textColor = '#6b7280',
}: ListFooterProps) {
  if (isFetchingNextPage) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={primaryColor} />
        <Text style={[styles.text, { color: textColor }]}>Loading more...</Text>
      </View>
    );
  }

  if (!hasNextPage && dataLength > 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: textColor }]}>No more records</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});
