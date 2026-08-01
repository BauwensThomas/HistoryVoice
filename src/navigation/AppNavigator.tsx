import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import MainScreen from '../screens/MainScreen';
import StoryScreen from '../screens/StoryScreen';
import RechargeScreen from '../screens/RechargeScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Login: undefined;
  Main: undefined;
  Story: {
    histoireGeneree: string;
    audioFilePath: string;
    showReviewModal: boolean;
    reviewTotal: number;
  };
  Recharge: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Story" component={StoryScreen} />
        <Stack.Screen name="Recharge" component={RechargeScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
