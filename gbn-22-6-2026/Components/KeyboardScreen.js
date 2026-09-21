import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  StyleSheet,
} from 'react-native';

/**
 * Standard fix for two recurring issues Apple's review flagged: (1) a
 * focused text field can end up hidden behind the keyboard, and (2) there
 * was no way to dismiss the keyboard except the return key. Wrap a screen's
 * scrollable content with this and both are solved: the keyboard pushes
 * content up instead of covering it, and tapping anywhere outside an input
 * (or another touchable) dismisses the keyboard.
 *
 * `keyboardVerticalOffset` only matters on iOS ('padding' behavior) - pass
 * the height of anything rendered above this component that isn't part of
 * the safe-area-aware layout already (rare; most screens can leave it at 0).
 */
export default function KeyboardScreen({
  children,
  style,
  keyboardVerticalOffset = 0,
}) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.flex}>{children}</View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
