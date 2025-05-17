import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import ScanScreen from "./screens/ScanScreen";
import RecentDocsScreen from "./screens/RecentDocsScreen";
import AllDocsScreen from "./screens/AllDocsScreen";
import ForensicScreen from "./screens/ForensicScreen";
import Toast, { BaseToast } from "react-native-toast-message";

const Stack = createNativeStackNavigator();

// Add toast config
const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "green" }}
    />
  ),
  error: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "red" }}
    />
  ),
};

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Scan" component={ScanScreen} />
          <Stack.Screen name="RecentDocs" component={RecentDocsScreen} />
          <Stack.Screen name="AllDocs" component={AllDocsScreen} />
          <Stack.Screen name="Forensic" component={ForensicScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast config={toastConfig} />
    </>
  );
}
