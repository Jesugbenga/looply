import React from "react";
import { StyleSheet, View, Text, SafeAreaView, Image } from "react-native";
import tw from 'twrnc';
import NavOptions from "@/components/NavOptions";
// import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useDispatch } from "react-redux";
import { setOrigin, setDestination } from "@/slices/navSlice";


const HomeScreen = () => {
  return (
    <SafeAreaView style={tw`bg-white h-full`}>
        <View style={tw`p-5`}>
            <Image 
                style={{ width: 100, height: 100, resizeMode: 'contain' }}
                source={{uri: "https://links.papareact.com/gzs"}} 
            />

            {/* <GooglePlacesAutocomplete
                placeholder='Where from?'
                nearbyPlacesAPI='GooglePlacesSearch'
                debounce={400}
                query={
                    {
                        key: 'AIzaSyDYvNDB2hvmg8zoFBRRKXIMQC4DSjE39o4', // Replace with your actual Google Maps API key
                        language: 'en',
                    }
                } 
            /> */}
            <NavOptions />
        </View>
    </SafeAreaView>
  );
};
export default HomeScreen;

const styles = StyleSheet.create({

});