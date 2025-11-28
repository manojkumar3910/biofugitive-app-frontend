import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, ActivityIndicator } from "react-native-paper";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useAppTheme } from "../context/ThemeContext";
import { spacing, borderRadius, shadows, typography, glassmorphism } from "../theme";
import { API_ENDPOINTS } from "../config/api";

const { width, height } = Dimensions.get('window');

// Animated orb component for background
const AnimatedOrb = ({ size, color, initialX, initialY, duration }) => {
  const translateX = useRef(new Animated.Value(initialX)).current;
  const translateY = useRef(new Animated.Value(initialY)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateOrb = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: initialX + 50,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: initialX - 50,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: initialX,
              duration: duration,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: initialY - 30,
              duration: duration * 0.8,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: initialY + 30,
              duration: duration * 0.8,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: initialY,
              duration: duration * 0.8,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.2,
              duration: duration * 0.5,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.9,
              duration: duration * 0.5,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: duration * 0.5,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };
    animateOrb();
  }, []);

  return (
    <Animated.View
      style={[
        orbStyles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    />
  );
};

const orbStyles = StyleSheet.create({
  orb: {
    position: 'absolute',
    opacity: 0.6,
  },
});

export default function SignupScreen({ navigation }) {
  const { colors, isDark } = useAppTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Error states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loginIdError, setLoginIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const glassStyle = isDark ? glassmorphism.dark : glassmorphism.light;

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateInputs = () => {
    let isValid = true;
    
    // Validate name (optional but if provided should be valid)
    if (name.trim() && name.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      isValid = false;
    } else {
      setNameError("");
    }
    
    // Validate email (optional but if provided should be valid)
    if (email.trim() && !validateEmail(email.trim())) {
      setEmailError("Please enter a valid email");
      isValid = false;
    } else {
      setEmailError("");
    }
    
    // Validate login ID (required)
    if (!loginId.trim()) {
      setLoginIdError("Login ID is required");
      isValid = false;
    } else if (loginId.trim().length < 3) {
      setLoginIdError("Login ID must be at least 3 characters");
      isValid = false;
    } else {
      setLoginIdError("");
    }
    
    // Validate password (required)
    if (!password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError("Password must be at least 4 characters");
      isValid = false;
    } else {
      setPasswordError("");
    }
    
    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    } else {
      setConfirmPasswordError("");
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

  const handleSignup = async () => {
    Keyboard.dismiss();
    
    if (!validateInputs()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await fetch(
        API_ENDPOINTS.SIGNUP,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            user_id: loginId, 
            password,
            email: email.trim() || null,
            name: name.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: "success",
          text1: "Account Created!",
          text2: "You can now login with your credentials",
          position: "top",
        });
        setTimeout(() => navigation.replace("Login"), 1500);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: "Signup Failed",
          text2: data.message,
          position: "top",
        });
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Network Error",
        text2: "Please check your connection",
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      {/* Animated Background Orbs */}
      <View style={styles.orbContainer}>
        <AnimatedOrb
          size={200}
          color={isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}
          initialX={-50}
          initialY={100}
          duration={8000}
        />
        <AnimatedOrb
          size={150}
          color={isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}
          initialX={width - 100}
          initialY={height - 300}
          duration={10000}
        />
        <AnimatedOrb
          size={100}
          color={isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)'}
          initialX={width / 2}
          initialY={200}
          duration={7000}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable style={styles.inner} onPress={Keyboard.dismiss}>
              {/* Logo Section */}
              <Animated.View 
                style={[
                  styles.logoContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: logoScale }],
                  }
                ]}
              >
                <View style={styles.logoWrapper}>
                  <Image
                    source={require("../assets/Leo D01.jpg")}
                    style={styles.logo}
                  />
                  <View style={styles.logoGlow} />
                </View>
                <Text style={styles.title}>CREATE ACCOUNT</Text>
                <Text style={styles.tagline}>Join BIO-FUGITIVE FINDER</Text>
              </Animated.View>

              {/* Glassmorphism Form Card */}
              <Animated.View 
                style={[
                  styles.formWrapper,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  }
                ]}
              >
                <BlurView
                  intensity={isDark ? 40 : 60}
                  tint={isDark ? "dark" : "light"}
                  style={styles.blurContainer}
                >
                  <View style={[styles.formContainer, { 
                    backgroundColor: glassStyle.background,
                    borderColor: glassStyle.border,
                    borderWidth: 1,
                  }]}>
              {/* Name Input */}
                    <TextInput
                      mode="outlined"
                      label="Full Name (Optional)"
                      placeholder="Enter your full name"
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        if (nameError) setNameError("");
                      }}
                      error={!!nameError}
                      left={<TextInput.Icon icon="account-outline" color={colors.textSecondary} />}
                      style={styles.input}
                      outlineStyle={styles.inputOutline}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                      textColor={colors.text}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="words"
                      autoCorrect={false}
                      theme={{ colors: { onSurfaceVariant: colors.textSecondary } }}
                    />
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}

              {/* Email Input */}
                    <TextInput
                      mode="outlined"
                      label="Email (Optional)"
                      placeholder="Enter your email"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (emailError) setEmailError("");
                      }}
                      error={!!emailError}
                      left={<TextInput.Icon icon="email-outline" color={colors.textSecondary} />}
                      style={styles.input}
                      outlineStyle={styles.inputOutline}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                      textColor={colors.text}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      theme={{ colors: { onSurfaceVariant: colors.textSecondary } }}
                    />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}

              {/* Login ID Input */}
                    <TextInput
                      mode="outlined"
                      label="Login ID *"
                      placeholder="Choose a unique login ID"
                      value={loginId}
                      onChangeText={(text) => {
                        setLoginId(text);
                        if (loginIdError) setLoginIdError("");
                      }}
                      error={!!loginIdError}
                      left={<TextInput.Icon icon="account" color={colors.textSecondary} />}
                      style={styles.input}
                      outlineStyle={styles.inputOutline}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                      textColor={colors.text}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      theme={{ colors: { onSurfaceVariant: colors.textSecondary } }}
                    />
              {loginIdError ? (
                <Text style={styles.errorText}>{loginIdError}</Text>
              ) : null}

              {/* Password Input */}
                    <TextInput
                      mode="outlined"
                      label="Password *"
                      placeholder="Create a password"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) setPasswordError("");
                      }}
                      error={!!passwordError}
                      left={<TextInput.Icon icon="lock" color={colors.textSecondary} />}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? "eye-off" : "eye"}
                          color={colors.textSecondary}
                          onPress={() => {
                            setShowPassword(!showPassword);
                            Haptics.selectionAsync();
                          }}
                        />
                      }
                      style={styles.input}
                      outlineStyle={styles.inputOutline}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                      textColor={colors.text}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      theme={{ colors: { onSurfaceVariant: colors.textSecondary } }}
                    />
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}

              {/* Confirm Password Input */}
                    <TextInput
                      mode="outlined"
                      label="Confirm Password *"
                      placeholder="Confirm your password"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (confirmPasswordError) setConfirmPasswordError("");
                      }}
                      error={!!confirmPasswordError}
                      left={<TextInput.Icon icon="lock-check" color={colors.textSecondary} />}
                      right={
                        <TextInput.Icon
                          icon={showConfirmPassword ? "eye-off" : "eye"}
                          color={colors.textSecondary}
                          onPress={() => {
                            setShowConfirmPassword(!showConfirmPassword);
                            Haptics.selectionAsync();
                          }}
                        />
                      }
                      style={styles.input}
                      outlineStyle={styles.inputOutline}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                      textColor={colors.text}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      theme={{ colors: { onSurfaceVariant: colors.textSecondary } }}
                    />
              {confirmPasswordError ? (
                      <Text style={styles.errorText}>{confirmPasswordError}</Text>
                    ) : null}

                    {/* Gradient Signup Button */}
                    <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: spacing.md }}>
                      <Pressable
                        onPress={handleSignup}
                        onPressIn={handleButtonPressIn}
                        onPressOut={handleButtonPressOut}
                        disabled={isLoading}
                        style={styles.buttonWrapper}
                      >
                        <LinearGradient
                          colors={['#3B82F6', '#8B5CF6']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.gradientButton}
                        >
                          {isLoading ? (
                            <ActivityIndicator color="#fff" size={24} />
                          ) : (
                            <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
                          )}
                        </LinearGradient>
                      </Pressable>
                    </Animated.View>

                    {/* Login Link */}
                    <View style={styles.loginLinkContainer}>
                      <Text style={styles.loginLinkText}>Already have an account? </Text>
                      <Pressable 
                        onPress={() => {
                          Haptics.selectionAsync();
                          navigation.navigate("Login");
                        }}
                      >
                        <Text style={styles.loginLink}>Login</Text>
                      </Pressable>
                    </View>
                  </View>
                </BlurView>
              </Animated.View>

              {/* Footer */}
              <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                <Text style={styles.footerText}>
                  Protected by advanced biometric security
                </Text>
              </Animated.View>
            </Pressable>
          </ScrollView>
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
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: colors.primary,
    ...shadows.lg,
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 55,
    backgroundColor: colors.primary,
    opacity: 0.2,
    zIndex: -1,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
    letterSpacing: 2,
  },
  tagline: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    letterSpacing: 1,
  },
  formWrapper: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  formContainer: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  input: {
    marginBottom: spacing.sm,
    backgroundColor: colors.inputBackground,
  },
  inputOutline: {
    borderRadius: borderRadius.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  buttonWrapper: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  gradientButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  buttonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginLinkText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  loginLink: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
