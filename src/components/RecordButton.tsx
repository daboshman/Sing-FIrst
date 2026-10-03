import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, useScale } from '../theme';

type Props = {
  isRecording: boolean;
  isProcessing: boolean;
  disabled?: boolean;
  onPress: () => void;
};

const useNativeDriver = Platform.OS !== 'web';

export function RecordButton({ isRecording, isProcessing, disabled, onPress }: Props) {
  const { scale } = useScale();
  const pulse = useRef(new Animated.Value(0)).current;
  const size = 150 * scale;

  useEffect(() => {
    if (!isRecording) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.ease),
        useNativeDriver,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [isRecording, pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  const label = isProcessing ? 'Listening…' : isRecording ? 'Tap to stop' : 'Tap to sing';

  return (
    <View style={styles.wrapper}>
      <View style={{ width: size * 1.6, height: size * 1.6, alignItems: 'center', justifyContent: 'center' }}>
        {isRecording && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />
        )}
        <Pressable
          onPress={onPress}
          disabled={disabled || isProcessing}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
          accessibilityState={{ disabled: disabled || isProcessing, busy: isProcessing }}
          style={({ pressed }) => [
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isRecording ? colors.recording : colors.record,
              borderWidth: 6 * scale,
            },
            (disabled || isProcessing) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color={colors.text} />
          ) : (
            <View
              style={
                isRecording
                  ? { width: 44 * scale, height: 44 * scale, borderRadius: 8 * scale, backgroundColor: colors.text }
                  : { width: 56 * scale, height: 56 * scale, borderRadius: 28 * scale, backgroundColor: colors.text }
              }
            />
          )}
        </Pressable>
      </View>
      <Text style={[styles.label, { fontSize: 18 * scale }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    backgroundColor: colors.recording,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  label: {
    color: colors.text,
    fontWeight: '800',
    marginTop: -8,
  },
});
