/**
 * Main App component for React Native
 * Entry point for the mobile application
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// TODO: Import navigation and screens
// import RootNavigator from './src/navigation/RootNavigator';

// Create React Query client for data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          {/* TODO: Add RootNavigator */}
          {/* <RootNavigator /> */}
          <StatusBar style="auto" />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
