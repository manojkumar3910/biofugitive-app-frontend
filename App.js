import React, { useState, useMemo, createContext, useContext, useEffect } from "react";
import { StatusBar, View, Text, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { PaperProvider, Icon } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import HomeScreen from "./screens/HomeScreen";
import ScanScreen from "./screens/ScanScreen";
import RecentDocsScreen from "./screens/RecentDocsScreen";
import AllDocsScreen from "./screens/AllDocsScreen";
import ForensicScreen from "./screens/ForensicScreen";
import PersonDetailScreen from "./screens/PersonDetailScreen";
import Toast, { BaseToast } from "react-native-toast-message";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ActivityProvider } from "./context/ActivityContext";
import { ThemeContext, useAppTheme } from "./context/ThemeContext";
import theme, { lightColors, darkColors } from "./theme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Dynamic Toast config that uses current theme
const createToastConfig = (colors) => ({
  success: (props) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: colors.success,
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginHorizontal: 16,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{ fontSize: 16, fontWeight: '600', color: colors.text }}
      text2Style={{ fontSize: 14, color: colors.textSecondary }}
    />
  ),
  error: (props) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: colors.danger || colors.error,
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginHorizontal: 16,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{ fontSize: 16, fontWeight: '600', color: colors.text }}
      text2Style={{ fontSize: 14, color: colors.textSecondary }}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: colors.info,
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginHorizontal: 16,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{ fontSize: 16, fontWeight: '600', color: colors.text }}
      text2Style={{ fontSize: 14, color: colors.textSecondary }}
    />
  ),
});

// Main Tab Navigator
function MainTabs() {
  const { colors } = useAppTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Scan':
              iconName = focused ? 'camera' : 'camera-outline';
              break;
            case 'Documents':
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            case 'Forensic':
              iconName = focused ? 'fingerprint' : 'fingerprint';
              break;
            default:
              iconName = 'circle';
          }
          
          return <Icon source={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Scan" 
        component={ScanScreen}
        options={{ tabBarLabel: 'Scan' }}
      />
      <Tab.Screen 
        name="Documents" 
        component={AllDocsScreen}
        options={{ tabBarLabel: 'Documents' }}
      />
      <Tab.Screen 
        name="Forensic" 
        component={ForensicScreen}
        options={{ tabBarLabel: 'Forensic' }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator
function AppNavigator() {
  const { colors } = useAppTheme();
  const { isLoggedIn, isLoading } = useAuth();
  
  // Show nothing while checking auth (splash screen handles this)
  if (isLoading) {
    return null;
  }
  
  return (
    <Stack.Navigator
      initialRouteName={isLoggedIn ? "MainApp" : "Login"}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      {!isLoggedIn ? (
        // Auth screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : (
        // App screens
        <>
          <Stack.Screen 
            name="MainApp" 
            component={MainTabs}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen 
            name="RecentDocs" 
            component={RecentDocsScreen}
            options={{
              headerShown: true,
              headerTitle: 'Recent Documents',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerShadowVisible: false,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen 
            name="AllDocs" 
            component={AllDocsScreen}
            options={{
              headerShown: true,
              headerTitle: 'All Documents',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen 
            name="PersonDetail" 
            component={PersonDetailScreen}
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// Splash/Loading Screen
function SplashScreen({ colors }) {
  return (
    <View style={[splashStyles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.gradients?.mesh || [colors.background, colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <View style={splashStyles.content}>
        <View style={[splashStyles.logoContainer, { backgroundColor: colors.primary }]}>
          <Icon source="shield-check" size={48} color="#fff" />
        </View>
        <Text style={[splashStyles.title, { color: colors.text }]}>BIO-FUGITIVE</Text>
        <Text style={[splashStyles.subtitle, { color: colors.primary }]}>IDENTIFICATION SYSTEM</Text>
        <ActivityIndicator size="large" color={colors.primary} style={splashStyles.loader} />
      </View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    marginTop: 8,
  },
  loader: {
    marginTop: 40,
  },
});

// Main App Component
function AppContent() {
  const [isDark, setIsDark] = useState(true);
  const { isLoading } = useAuth();
  
  // Dynamic theme context
  const themeContext = useMemo(() => {
    const colors = isDark ? darkColors : lightColors;
    return {
      isDark,
      toggleTheme: () => setIsDark(prev => !prev),
      colors,
    };
  }, [isDark]);
  
  const colors = themeContext.colors;
  const paperTheme = colors.paperTheme;
  const toastConfig = useMemo(() => createToastConfig(colors), [colors]);

  // Show splash while loading auth or fonts
  if (isLoading) {
    return <SplashScreen colors={colors} />;
  }

  return (
    <ThemeContext.Provider value={themeContext}>
      <PaperProvider theme={paperTheme}>
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <Toast config={toastConfig} topOffset={60} />
      </PaperProvider>
    </ThemeContext.Provider>
  );
}

export default function App() {
  // Load fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Show loading until fonts are ready
  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <SplashScreen colors={darkColors} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ActivityProvider>
          <AppContent />
        </ActivityProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
