import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Without this, any uncaught render-time error (a null property access, a
// bad API response shape, etc.) takes the whole app down to a blank/red
// screen with no way back in except force-quitting. This catches it one
// level below the navigator so the user gets a recoverable screen instead.
export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.log('🚨 Unhandled app error:', error, info?.componentStack);
  }

  handleRestart = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>😕</Text>
          <Text style={styles.title}>Something went wrong on our end</Text>
          <Text style={styles.message}>
            Sorry about that — this screen ran into a problem. Give it
            another try, and if it keeps happening, let us know so we can
            fix it for you.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B3D2E',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    color: '#cfe8db',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  button: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '700',
  },
});
