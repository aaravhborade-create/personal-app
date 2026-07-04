import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ImageBackground
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useFonts } from 'expo-font';

export default function Recipes({ navigation }) {
  let [fontsLoaded] = useFonts({
   Heathergreen: require('../Heathergreen.otf'),  
});

  
   if (!fontsLoaded) {
  }

  return (
 <ImageBackground source={{uri: "https://img.freepik.com/premium-photo/close-up-fresh-carambola-fruit-with-raindrops-tropical-garden_868797-52001.jpg?semt=ais_hybrid&w=740&q=80" }}style={{flex:1}} > 
      <View style={styles.container}>
              <View>
        <Text style={styles.title}>Dashboard</Text>
        </View>
          <TouchableOpacity 
        style={styles.button1}
           onPress={() => navigation.navigate('Recipes')}>
          
          <Text style={styles.buttonText}>Recipes</Text>
              </TouchableOpacity>

        <TouchableOpacity 
        style={styles.button2}
        onPress = {() => navigation.navigate('MealPlanner')}>
          <Text style={styles.buttonText}>Meal Planner</Text>
        </TouchableOpacity>

        <TouchableOpacity 
        style={styles.button3}
        onPress = {() => navigation.navigate('Calories')}>
          <Text style={styles.buttonText}>Calories</Text>
        </TouchableOpacity>

        <TouchableOpacity 
        style={styles.button4}
        onPress = {() => navigation.navigate('GroceryList')}>
          <Text style={styles.buttonText}>Grocery List</Text>
        </TouchableOpacity>

        <TouchableOpacity 
        style={styles.button5}
        onPress = {() => navigation.navigate('Profile')}>
          <Text style={styles.buttonText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
        style={styles.button5}
        onPress = {() => navigation.navigate('SignInScreen')}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>  
        </View>  
         </ImageBackground>    

        

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 8,
  },
  title: {
    marginBottom: 0,
    fontSize: 35,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
    fontFamily: 'Heathergreen',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button1: {
    backgroundColor: 'black',
    marginBottom: 15,
    padding: 12,
    borderRadius: 20,
    width: '40%',
    marginLeft: 30,
  },
  button2: {
    backgroundColor: 'black',
    marginBottom: 15,
    padding: 12,
    borderRadius: 20,
    width: '50%',
    marginLeft: 30,
  },
  button3: {
    backgroundColor: 'black',
    marginBottom: 15,
    padding: 12,
    borderRadius: 20,
    width: '40%',
    marginLeft: 30,
  },
  button4: {
    backgroundColor: 'black',
    marginBottom: 15,
    padding: 12,
    borderRadius: 20,
    width: '40%',
    marginLeft: 30,
  },
  button5: {
    backgroundColor: 'black',
    marginBottom: 15,
    padding: 12,
    borderRadius: 20,
    width: '40%',
    marginLeft: 30,
  },
});
