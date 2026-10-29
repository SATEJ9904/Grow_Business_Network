import React, { useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';

/**
 * Full-screen (85%) flyer viewer with pinch-to-zoom, drag-to-pan while
 * zoomed, and double-tap to toggle zoom. Built on PanResponder so it needs
 * no extra native gesture library.
 */
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_DELAY = 280;
const TAP_SLOP = 8;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const touchDistance = touches => {
  const [a, b] = touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
};

const FlyerViewer = ({ visible, uri, onClose }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const boxWidth = screenWidth * 0.85;
  const boxHeight = screenHeight * 0.85;

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Live values mirrored in refs — PanResponder handlers read these
  // synchronously instead of the Animated.Values.
  const current = useRef({ scale: 1, x: 0, y: 0 });
  const gesture = useRef({ touchCount: 0, startDistance: 0, startScale: 1, startX: 0, startY: 0, startPageX: 0, startPageY: 0, moved: false });
  const lastTapAt = useRef(0);

  const clampTranslation = (x, y, s) => {
    const maxX = (boxWidth * s - boxWidth) / 2;
    const maxY = (boxHeight * s - boxHeight) / 2;
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  };

  const applyInstant = (s, x, y) => {
    current.current = { scale: s, x, y };
    scale.setValue(s);
    translateX.setValue(x);
    translateY.setValue(y);
  };

  const animateTo = (s, x, y) => {
    current.current = { scale: s, x, y };
    Animated.parallel([
      Animated.spring(scale, { toValue: s, useNativeDriver: true, friction: 7 }),
      Animated.spring(translateX, { toValue: x, useNativeDriver: true, friction: 7 }),
      Animated.spring(translateY, { toValue: y, useNativeDriver: true, friction: 7 }),
    ]).start();
  };

  // Every time the viewer opens, start un-zoomed.
  useEffect(() => {
    if (visible) applyInstant(1, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const startGesture = touches => {
    const g = gesture.current;
    g.touchCount = touches.length;
    g.startScale = current.current.scale;
    g.startX = current.current.x;
    g.startY = current.current.y;
    g.startPageX = touches[0].pageX;
    g.startPageY = touches[0].pageY;
    g.startDistance = touches.length >= 2 ? touchDistance(touches) : 0;
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: evt => {
          gesture.current.moved = false;
          startGesture(evt.nativeEvent.touches);
        },
        onPanResponderMove: evt => {
          const touches = evt.nativeEvent.touches;
          if (!touches.length) return;

          // Finger added/removed mid-gesture: re-baseline so nothing jumps.
          if (touches.length !== gesture.current.touchCount) {
            startGesture(touches);
            return;
          }

          const g = gesture.current;
          const dx = touches[0].pageX - g.startPageX;
          const dy = touches[0].pageY - g.startPageY;
          if (Math.abs(dx) > TAP_SLOP || Math.abs(dy) > TAP_SLOP) g.moved = true;

          if (touches.length >= 2 && g.startDistance > 0) {
            g.moved = true;
            const nextScale = clamp((g.startScale * touchDistance(touches)) / g.startDistance, MIN_SCALE * 0.8, MAX_SCALE);
            const { x, y } = clampTranslation(g.startX, g.startY, Math.max(nextScale, 1));
            applyInstant(nextScale, x, y);
          } else if (current.current.scale > 1) {
            const { x, y } = clampTranslation(g.startX + dx, g.startY + dy, current.current.scale);
            applyInstant(current.current.scale, x, y);
          }
        },
        onPanResponderRelease: () => {
          const { scale: s, x, y } = current.current;

          if (!gesture.current.moved) {
            const now = Date.now();
            if (now - lastTapAt.current < DOUBLE_TAP_DELAY) {
              lastTapAt.current = 0;
              if (s > 1) animateTo(1, 0, 0);
              else animateTo(DOUBLE_TAP_SCALE, 0, 0);
              return;
            }
            lastTapAt.current = now;
          }

          if (s <= 1) {
            animateTo(1, 0, 0);
          } else {
            const clamped = clampTranslation(x, y, s);
            animateTo(s, clamped.x, clamped.y);
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boxWidth, boxHeight],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.box, { width: boxWidth, height: boxHeight }]} {...panResponder.panHandlers}>
          <Animated.Image
            source={{ uri }}
            resizeMode="contain"
            style={[
              styles.image,
              { transform: [{ translateX }, { translateY }, { scale }] },
            ]}
          />
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Close flyer"
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Pinch or double-tap to zoom</Text>
      </View>
    </Modal>
  );
};

export default FlyerViewer;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  hint: {
    position: 'absolute',
    bottom: 28,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
});
