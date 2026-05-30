import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const saveUser = async () => {
    if (!name || !email || !password) {
      Alert.alert('Please fill all fields');
      return;
    }

    // Basic email format check
    if (!email.includes('@')) {
      Alert.alert('Please enter a valid email');
      return;
    }

    // Basic password length check
    if (password.length < 6) {
      Alert.alert('Password must be at least 6 characters');
      return;
    }

    try {
      const user = { name, email, password };
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      Alert.alert('Account Created Successfully', `Welcome, ${name}!`);
      navigation.navigate('LoginInScreen');
    } catch (err) {
      console.log('Signup error:', err);
      Alert.alert('Something went wrong. Please try again.');
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://plus.unsplash.com/premium_photo-1674831509107-f25ba87ffbf1?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZnJ1aXQlMjBjbG9zZSUyMHVwfGVufDB8fDB8fHww',
      }}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.heading}>Sign Up</Text>

        <TextInput
          placeholder="Name"
          placeholderTextColor="#888"
          style={styles.TextInput}
          onChangeText={setName}
          value={name}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.TextInput}
          onChangeText={setEmail}
          value={email}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          style={styles.TextInput}
          onChangeText={setPassword}
          value={password}
        />

        <TouchableOpacity style={styles.button} onPress={saveUser}>
          <Text style={styles.text1}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('LoginInScreen')}>
          <Text style={styles.text2}>Already Have An Account? Login</Text>
        </TouchableOpacity>
      </View>
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
  text1: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  text2: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 20,
  },
});