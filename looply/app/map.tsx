import React from 'react';
import { StyleSheet } from "react-native";
import { Provider } from 'react-redux';
import { store } from '@/store';
import MapScreen from '@/screens/MapScreen';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Map() {
  return (
    <Provider store={store}>
      <SafeAreaView style={styles.container}>
        <MapScreen />
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});