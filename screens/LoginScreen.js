import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, ActivityIndicator } from "react-native-paper";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { 
  Shield, 
  Fingerprint, 
  Eye, 
  EyeOff, 
  User, 
  Lock,
  ChevronRight,
  Scan,
  UserPlus,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useAppTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { spacing, borderRadius, shadows } from "../theme";
import { API_ENDPOINTS } from "../config/api";

const { width, height } = Dimensions.get("window");

// Glowing orb component
const GlowingOrb = ({ color, size, top, left, delay }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.3,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useAppTheme();
  const { login } = useAuth();
  
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginIdError, setLoginIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isFocused, setIsFocused] = useState({ loginId: false, password: false });
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const formSlide = useRef(new Animated.Value(100)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
    
    // Check biometric availability
    checkBiometricAvailability();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 40,
        friction: 6,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [isDark]);

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  const handleBiometricLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to access BIO-FUGITIVE",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Biometric Verified",
        text2: "Access granted via biometrics",
        position: "top",
      });
      await login("biometric_token", { id: "biometric_user", method: "biometric" });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Authentication Failed",
        text2: result.error || "Please try again",
        position: "top",
      });
    }
  };

  const validateInputs = () => {
    let isValid = true;

    if (!loginId.trim()) {
      setLoginIdError("Login ID is required");
      isValid = false;
    } else {
      setLoginIdError("");
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError("Password must be at least 4 characters");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!validateInputs()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: loginId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: "success",
          text1: "Access Granted",
          text2: "Welcome back, Officer",
          position: "top",
        });
        // Save session
        await login(data.token || "auth_token", { 
          id: loginId, 
          ...data.user,
          method: "password" 
        });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: "Access Denied",
          text2: data.message || "Invalid credentials",
          position: "top",
        });
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: "Unable to reach server",
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-5deg", "5deg"],
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // Create dynamic styles
  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={colors.gradients?.mesh || [colors.background, colors.backgroundSecondary || colors.background, colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated orbs */}
      <GlowingOrb color={colors.primary} size={300} top={-100} left={-100} delay={0} />
      <GlowingOrb color={colors.secondary || colors.primary} size={200} top={height * 0.3} left={width - 50} delay={1000} />
      <GlowingOrb color={colors.accent || colors.primary} size={150} top={height * 0.7} left={-50} delay={2000} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.inner} onPress={Keyboard.dismiss}>
            {/* Logo Section */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { scale: logoScale },
                    { translateY: slideAnim },
                  ],
                },
              ]}
            >
              {/* Logo glow */}
              <Animated.View
                style={[
                  styles.logoGlow,
                  { opacity: glowOpacity },
                ]}
              />
              
              {/* Shield icon with logo */}
              <Animated.View
                style={[
                  styles.logoWrapper,
                  { transform: [{ rotate: logoRotateInterpolate }] },
                ]}
              >
                <LinearGradient
                  colors={colors.gradients?.primary || [colors.primary, colors.primary]}
                  style={styles.logoBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Shield size={60} color="#fff" strokeWidth={1.5} />
                </LinearGradient>
              </Animated.View>

              <Text style={styles.title}>BIO-FUGITIVE</Text>
              <Text style={styles.subtitle}>IDENTIFICATION SYSTEM</Text>
              
              <View style={styles.taglineContainer}>
                <View style={styles.taglineDot} />
                <Text style={styles.tagline}>SECURE ACCESS PORTAL</Text>
                <View style={styles.taglineDot} />
              </View>
            </Animated.View>

            {/* Form Section */}
            <Animated.View
              style={[
                styles.formWrapper,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: formSlide }],
                },
              ]}
            >
              <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.formBlur}>
                <LinearGradient
                  colors={colors.gradients?.card || ['rgba(31, 41, 55, 0.8)', 'rgba(17, 24, 39, 0.9)']}
                  style={styles.formGradient}
                >
                  <View style={styles.formContainer}>
                    {/* Login ID Input */}
                    <View style={styles.inputWrapper}>
                      <View style={[
                        styles.inputContainer,
                        isFocused.loginId && styles.inputFocused,
                        loginIdError && styles.inputError,
                      ]}>
                        <User 
                          size={20} 
                          color={isFocused.loginId ? colors.primary : colors.textMuted}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          mode="flat"
                          placeholder="Enter Login ID"
                          placeholderTextColor={colors.textMuted}
                          value={loginId}
                          onChangeText={(text) => {
                            setLoginId(text);
                            if (loginIdError) setLoginIdError("");
                          }}
                          onFocus={() => setIsFocused(prev => ({ ...prev, loginId: true }))}
                          onBlur={() => setIsFocused(prev => ({ ...prev, loginId: false }))}
                          style={styles.input}
                          textColor={colors.text}
                          underlineColor="transparent"
                          activeUnderlineColor="transparent"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                      {loginIdError ? (
                        <Text style={styles.errorText}>{loginIdError}</Text>
                      ) : null}
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputWrapper}>
                      <View style={[
                        styles.inputContainer,
                        isFocused.password && styles.inputFocused,
                        passwordError && styles.inputError,
                      ]}>
                        <Lock 
                          size={20} 
                          color={isFocused.password ? colors.primary : colors.textMuted}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          mode="flat"
                          placeholder="Enter Password"
                          placeholderTextColor={colors.textMuted}
                          secureTextEntry={!showPassword}
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            if (passwordError) setPasswordError("");
                          }}
                          onFocus={() => setIsFocused(prev => ({ ...prev, password: true }))}
                          onBlur={() => setIsFocused(prev => ({ ...prev, password: false }))}
                          style={styles.input}
                          textColor={colors.text}
                          underlineColor="transparent"
                          activeUnderlineColor="transparent"
                          autoCapitalize="none"
                        />
                        <Pressable
                          onPress={() => {
                            setShowPassword(!showPassword);
                            Haptics.selectionAsync();
                          }}
                          style={styles.eyeButton}
                        >
                          {showPassword ? (
                            <EyeOff size={20} color={colors.textMuted} />
                          ) : (
                            <Eye size={20} color={colors.textMuted} />
                          )}
                        </Pressable>
                      </View>
                      {passwordError ? (
                        <Text style={styles.errorText}>{passwordError}</Text>
                      ) : null}
                    </View>

                    {/* Login Button */}
                    <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                      <Pressable
                        onPress={handleLogin}
                        onPressIn={handleButtonPressIn}
                        onPressOut={handleButtonPressOut}
                        disabled={isLoading}
                        style={styles.buttonWrapper}
                      >
                        <LinearGradient
                          colors={isLoading ? ['#374151', '#374151'] : (colors.gradients?.primary || [colors.primary, colors.primary])}
                          style={styles.button}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          {isLoading ? (
                            <ActivityIndicator color="#fff" size={24} />
                          ) : (
                            <>
                              <Text style={styles.buttonText}>AUTHENTICATE</Text>
                              <ChevronRight size={20} color="#fff" />
                            </>
                          )}
                        </LinearGradient>
                      </Pressable>
                    </Animated.View>

                    {/* Biometric Option */}
                    {biometricAvailable && (
                      <View style={styles.biometricSection}>
                        <View style={styles.dividerContainer}>
                          <View style={styles.divider} />
                          <Text style={styles.dividerText}>or</Text>
                          <View style={styles.divider} />
                        </View>

                        <Pressable
                          style={styles.biometricButton}
                          onPress={handleBiometricLogin}
                        >
                          <Fingerprint size={32} color={colors.primary} />
                          <Text style={styles.biometricText}>Use Biometric Login</Text>
                        </Pressable>
                      </View>
                    )}

                    {/* Sign Up Link */}
                    <Pressable
                      style={styles.signupLink}
                      onPress={() => {
                        Haptics.selectionAsync();
                        navigation.navigate("Signup");
                      }}
                    >
                      <Text style={styles.signupText}>Don't have an account? </Text>
                      <Text style={styles.signupTextBold}>Sign Up</Text>
                      <UserPlus size={16} color={colors.primary} style={{ marginLeft: 6 }} />
                    </Pressable>
                  </View>
                </LinearGradient>
              </BlurView>
            </Animated.View>

            {/* Footer */}
            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
              <Scan size={16} color={colors.textMuted} />
              <Text style={styles.footerText}>
                Protected by advanced encryption
              </Text>
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  
  // Logo
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  logoWrapper: {
    marginBottom: spacing.lg,
  },
  logoBg: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.primary,
    marginTop: spacing.xs,
    letterSpacing: 6,
    textTransform: "uppercase",
  },
  taglineContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  taglineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  tagline: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  
  // Form
  formWrapper: {
    borderRadius: borderRadius.xxl,
    overflow: "hidden",
    ...shadows.lg,
  },
  formBlur: {
    borderRadius: borderRadius.xxl,
    overflow: "hidden",
  },
  formGradient: {
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.glass?.border || colors.borderSubtle,
  },
  formContainer: {
    padding: spacing.lg,
  },
  inputWrapper: {
    marginBottom: spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground || colors.glass?.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: "transparent",
    fontSize: 16,
    height: 56,
  },
  eyeButton: {
    padding: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  
  // Button
  buttonWrapper: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    gap: spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 2,
  },
  
  // Biometric
  biometricSection: {
    marginTop: spacing.lg,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  biometricText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  
  // Sign up link
  signupLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  signupText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signupTextBold: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  
  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
