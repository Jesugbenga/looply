import React from "react";
import { StyleSheet, Image, Text, Platform, View, FlatList, TouchableOpacity } from "react-native";
import tw from 'twrnc';
import { Icon } from 'react-native-elements';
import { router } from 'expo-router';

const data = [ 
    {   
        id: "123",
        title: "Get a ride",
        image: "https://links.papareact.com/3pn",
        screen: "map", 
    },
    {
        id: "456",
        title: "Order food",
        image: "https://links.papareact.com/28w",
        screen: "eat", 
    }
];

const NavOptions = () => {
    const handlePress = (screen: string) => { 
        if (screen === "map") {
            router.push('/map');
        } else if (screen === "eat") {
            // Navigate to eats screen when you create it
            // router.push('/(tabs)/eats');
            console.log("Eats screen not implemented yet");
        }
    };

    return (
        <FlatList
            data={data}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <TouchableOpacity 
                    style={tw`p-2 pl-6 pb-8 pt-4 bg-gray-200 m-2 w-40`}
                    onPress={() => handlePress(item.screen)}
                >
                    <View style={{ width: 100, padding: 10 }}>
                        <Image 
                            style={{ width: 120, height: 120, resizeMode: 'contain' }}
                            source={{ uri: item.image }}    
                        />
                        <Text style={tw`mt-2 text-lg font-semibold`}>{item.title}</Text>
                        <Icon 
                            name="arrowright" 
                            type="antdesign" 
                            color="white" 
                            style={tw`p-2 bg-black rounded-full w-10 mt-4`}
                        />
                    </View>
                </TouchableOpacity>
            )} 
        />
    );
};

export default NavOptions;

const styles = StyleSheet.create({});