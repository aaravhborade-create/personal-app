import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignInScreen from './screens/SignInScreen';
import LoginInScreen from './screens/LoginInScreen';
import Dashboard from './screens/Dashboard';
import Recipes from './screens/Recipes';
import MealPlanner from './screens/MealPlanner';
import Calories from './screens/Calories';
import GroceryList from './screens/GroceryList';
import Profile from './screens/Profile';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignInScreen">
        <Stack.Screen name="SignInScreen" component={SignInScreen} />
        <Stack.Screen name="LoginInScreen" component={LoginInScreen} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="Recipes" component={Recipes} />
            <Stack.Screen name="MealPlanner" component={MealPlanner} />
              <Stack.Screen name="Calories" component={Calories} />
                <Stack.Screen name="GroceryList" component={GroceryList}/>
                <Stack.Screen name="Profile" component={Profile}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
