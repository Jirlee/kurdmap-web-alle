import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { MAX_LENGTHS } from '@/utils/validation';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onFilterPress?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onFilterPress,
  placeholder,
  autoFocus = false,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.glassStrong,
          borderColor: isFocused ? theme.colors.primary : theme.colors.glassBorder,
          shadowColor: isFocused ? theme.colors.primary : theme.colors.shadow,
        },
      ]}
      accessibilityRole="search"
    >
      <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
      <TextInput
        style={[styles.input, { color: theme.colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? t('searchPlaceholder')}
        placeholderTextColor={theme.colors.textTertiary}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={MAX_LENGTHS.search}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          style={styles.clearBtn}
          accessibilityRole="button"
          accessibilityLabel={t('cancel')}
        >
          <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
        </Pressable>
      )}
      {onFilterPress && (
        <Pressable
          onPress={onFilterPress}
          style={styles.filterBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('searchFilters')}
        >
          <Ionicons name="options-outline" size={20} color={theme.colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
    }),
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    minHeight: 22,
  },
  clearBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -12,
  },
  filterBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -12,
    marginRight: -8,
  },
});
