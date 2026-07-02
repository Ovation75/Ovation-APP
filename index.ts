// Must be the very first import in the app entry (before React/App) so
// react-native-gesture-handler — required by @react-navigation/drawer — sets
// up its native module before any component tree renders. Bundled in Expo Go.
import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
