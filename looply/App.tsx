import React from 'react';
import { StyleSheet, Text, View } from "react-native";
import { Provider } from 'react-redux';
import { store } from './store';
import HomeScreen from './app/(tabs)';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <Provider store={store}>
      <View style={styles.container}>
        <SafeAreaView>
          <HomeScreen />
        </SafeAreaView>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
