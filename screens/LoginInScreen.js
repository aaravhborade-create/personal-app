import React, { useState } from 'react';
import {
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginUser = async () => {
    // Basic empty field check
    if (!email || !password) {
      Alert.alert('Please enter email and password');
      return;
    }

    try {
      const userData = await AsyncStorage.getItem('userData');

      if (userData !== null) {
        const user = JSON.parse(userData);

        if (email === user.email && password === user.password) {
          Alert.alert('Login Successful', `Welcome back, ${user.name}!`);
          navigation.navigate('Dashboard');
        } else {
          Alert.alert('Invalid Credentials', 'Email or password is incorrect');
        }
      } else {
        Alert.alert('No Account Found', 'Please sign up first');
      }
    } catch (err) {
      console.log('Login error:', err);
      Alert.alert('Something went wrong. Please try again.');
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://media.istockphoto.com/id/612524020/photo/fresh-ripe-black-cherries-background-top-view-close-up.jpg?s=612x612&w=0&k=20&c=Y02Ocw1ThYZOkg8sAq4NvPSw2sUY2gP3KxYowYbu6fs=',
      }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <Text style={styles.heading}>Login</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#888"
          style={styles.TextInput}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          style={styles.TextInput}
          value={password}
          onChangeText={setPassword}
        />

        {/* Fixed: now calls loginUser instead of navigating directly */}
        <TouchableOpacity style={styles.button} onPress={loginUser}>
          <Text style={styles.text}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignInScreen')}>
          <Text style={styles.signupText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  heading: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  TextInput: {
    width: '80%',
    height: 50,
    borderWidth: 2,
    borderRadius: 20,
    marginTop: 20,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    borderColor: '#ddd',
  },
  button: {
    width: '60%',
    height: 50,
    borderRadius: 20,
    marginTop: 20,
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 20,
  },
});