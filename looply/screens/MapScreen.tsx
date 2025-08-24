import React from "react";
import { StyleSheet, Text, View } from "react-native";
import tw from 'twrnc';
import MapLogic from "@/components/MapLogic";


const MapScreen = () => {
  return (
    <View style={styles.container}>
      <View style={tw`h-1/2`}>
        <MapLogic />
      </View>

      <View style={tw`h-1/2`}>
        {/* Map component will go here */}
      </View>


    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});