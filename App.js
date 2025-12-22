/**
 * SRM Sweets Employee Management App
 * Main entry point
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigator from './src/navigation/Navigator';

const App = () => {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <Navigator />
    </SafeAreaProvider>
  );
};

export default App;
