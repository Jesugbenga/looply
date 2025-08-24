import React from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView from "react-native-maps";

const MapLogic = () => {
    return (
        <View style={styles.container}>
            <MapView style={{ flex: 1 }} 
                initialRegion={{
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            />
            
        </View>
    );
};

export default MapLogic

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'blue',
    },
});