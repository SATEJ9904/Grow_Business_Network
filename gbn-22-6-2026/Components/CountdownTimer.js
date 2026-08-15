import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const getTimeParts = targetDateTime => {
  const diff = new Date(targetDateTime).getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const pad = n => String(n).padStart(2, '0');

const CountdownTimer = ({ targetDateTime, compact = false }) => {
  const [parts, setParts] = useState(() => getTimeParts(targetDateTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setParts(getTimeParts(targetDateTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDateTime]);

  if (!parts) {
    if (compact) {
      return (
        <View style={styles.compactEndedBox}>
          <Text style={styles.compactEndedText}>Started</Text>
        </View>
      );
    }
    return (
      <View style={styles.endedBox}>
        <Text style={styles.endedText}>Meeting has started</Text>
      </View>
    );
  }

  if (compact) {
    const compactLabel =
      parts.days > 0
        ? `${parts.days}d ${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`
        : `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;

    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactValue}>{compactLabel}</Text>
      </View>
    );
  }

  const units = [
    { label: 'Days', value: parts.days },
    { label: 'Hrs', value: parts.hours },
    { label: 'Min', value: parts.minutes },
    { label: 'Sec', value: parts.seconds },
  ];

  return (
    <View style={styles.container}>
      {units.map((unit, index) => (
        <React.Fragment key={unit.label}>
          <View style={styles.unit}>
            <Text style={styles.value}>{pad(unit.value)}</Text>
            <Text style={styles.label}>{unit.label}</Text>
          </View>
          {index < units.length - 1 && <Text style={styles.sep}>:</Text>}
        </React.Fragment>
      ))}
    </View>
  );
};

export default CountdownTimer;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17310F',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  unit: {
    alignItems: 'center',
    minWidth: 44,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  label: {
    color: '#FF6B00',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  sep: {
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '800',
    fontSize: 18,
    marginTop: -8,
  },
  endedBox: {
    backgroundColor: '#EEF2EF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  endedText: {
    color: '#4B5563',
    fontWeight: '700',
    fontSize: 13,
  },
  compactContainer: {
    backgroundColor: '#17310F',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  compactValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  compactEndedBox: {
    backgroundColor: '#EEF2EF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  compactEndedText: {
    color: '#4B5563',
    fontWeight: '700',
    fontSize: 11,
  },
});
