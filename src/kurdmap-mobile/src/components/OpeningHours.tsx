import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import type { OpeningHours as OpeningHoursType, DaySchedule } from '@/types/api';

interface Props {
  hours: OpeningHoursType | null;
}

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function OpeningHoursDisplay({ hours }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (!hours) return null;

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <View style={styles.container}>
      {DAY_KEYS.map((day, index) => {
        const schedule = hours[day] as DaySchedule | null;
        const isToday = index === todayIndex;

        return (
          <View
            key={day}
            style={[
              styles.row,
              isToday && { backgroundColor: `${theme.colors.primary}10`, borderRadius: 8 },
            ]}
          >
            <Text
              style={[
                styles.day,
                { color: isToday ? theme.colors.primary : theme.colors.text },
                isToday && { fontWeight: '600' },
              ]}
            >
              {t(day)}
            </Text>
            <Text
              style={[
                styles.time,
                {
                  color: schedule?.closed
                    ? theme.colors.error
                    : isToday
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {schedule?.closed
                ? t('businessClosed')
                : schedule?.open && schedule?.close
                  ? `${schedule.open} – ${schedule.close}`
                  : '—'}
            </Text>
            {isToday && (
              <Ionicons
                name={schedule?.closed ? 'close-circle' : 'checkmark-circle'}
                size={16}
                color={schedule?.closed ? theme.colors.error : theme.colors.primary}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  day: {
    width: 100,
    fontSize: 14,
  },
  time: {
    flex: 1,
    fontSize: 14,
  },
});
