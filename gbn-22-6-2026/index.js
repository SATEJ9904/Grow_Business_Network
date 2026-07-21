/**
 * @format
 */

// Metro must run this before AppRegistry. Import it explicitly so the
// React Native global APIs (including `performance`) are available even when
// a cached or custom Metro configuration omits its normal prelude module.
import 'react-native/Libraries/Core/InitializeCore';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
