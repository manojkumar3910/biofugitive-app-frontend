import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  Pressable,
  Dimensions,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Surface, 
  Button, 
  IconButton,
  Portal,
  Modal,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { 
  Camera, 
  Fingerprint, 
  CreditCard, 
  User, 
  ChevronRight, 
  X,
  CheckCircle,
  Scan,
  RefreshCw,
  AlertCircle,
  SwitchCamera,
  Usb,
  Focus,
  CircleDot,
} from "lucide-react-native";
import { useAppTheme } from "../context/ThemeContext";
import { useActivity } from "../context/ActivityContext";
import { spacing, borderRadius, shadows, typography } from "../theme";

const { width, height } = Dimensions.get('window');
const SCAN_FRAME_SIZE = width * 0.88;

// Animated scan line component
function ScanLine({ colors }) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: SCAN_FRAME_SIZE - 4,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.scanLine,
        {
          backgroundColor: colors.primary,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

// Scan option card component
function ScanOption({ icon: Icon, title, description, onPress, colors, delay }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 400,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressScale, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: scaleAnim,
        transform: [{ scale: Animated.multiply(scaleAnim, pressScale) }],
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <BlurView intensity={20} tint="dark" style={styles.optionBlur}>
          <LinearGradient
            colors={colors.gradients?.card || ['rgba(31, 41, 55, 0.8)', 'rgba(17, 24, 39, 0.9)']}
            style={styles.optionCard}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
              <Icon size={28} color={colors.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                {description}
              </Text>
            </View>
            <ChevronRight size={24} color={colors.textMuted} />
          </LinearGradient>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

export default function ScanScreen() {
  const { colors, isDark } = useAppTheme();
  const { addActivity } = useActivity();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [scanType, setScanType] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('front');
  const cameraRef = useRef(null);
  
  const headerAnim = useRef(new Animated.Value(0)).current;
  const frameAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(frameAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const requestCameraPermission = async () => {
    const result = await requestPermission();
    return result.granted;
  };

  const startScan = async (type) => {
    setScanType(type);
    
    // Show device not connected modal for fingerprint
    if (type === "Fingerprint") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowDeviceModal(true);
      addActivity('SCAN_FAILED', { message: `${type} scan - Device not connected` });
      return;
    }
    
    // Check camera permission for other scan types
    if (!permission?.granted) {
      const granted = await requestCameraPermission();
      if (!granted) {
        Alert.alert(
          "Camera Permission Required",
          "Please grant camera access to use the scanning feature.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    
    // Set camera facing based on scan type
    setCameraFacing(type === "Facial" ? 'front' : 'back');
    
    setShowOptions(false);
    setCameraActive(true);
    setIsScanning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Log camera access activity
    addActivity('CAMERA_ACCESS', { message: `${type} scan started` });
  };

  const toggleCameraFacing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCameraFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const captureAndProcess = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsProcessing(true);
    
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        console.log("Photo captured:", photo.uri);
        // Here you would send the photo to your API for processing
        
        // Log successful scan
        addActivity('SCAN_SUCCESS', { message: `${scanType} scan completed successfully` });
      } catch (error) {
        console.error("Error capturing photo:", error);
        addActivity('SCAN_FAILED', { message: `${scanType} scan failed - ${error.message}` });
      }
    }
    
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      setIsScanning(false);
      setCameraActive(false);
      setShowResultModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  };

  const resetScan = () => {
    setShowResultModal(false);
    setShowDeviceModal(false);
    setScanType(null);
    setIsScanning(false);
    setIsProcessing(false);
    setCameraActive(false);
    setCameraFacing('front');
    // Delay showing options to allow modal to close
    setTimeout(() => {
      setShowOptions(true);
    }, 100);
  };

  const dynamicStyles = createStyles(colors);

  // Permission not determined yet
  if (!permission) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea}>
        <View style={dynamicStyles.permissionContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={dynamicStyles.permissionText}>Checking camera permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <LinearGradient
        colors={colors.gradients?.mesh || [colors.background, colors.background]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={dynamicStyles.container}>
        {/* Header */}
        <Animated.View 
          style={[
            dynamicStyles.header,
            {
              opacity: headerAnim,
              transform: [{
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              }],
            },
          ]}
        >
          <View style={dynamicStyles.headerTop}>
            <Camera size={24} color={colors.primary} />
            <Text style={dynamicStyles.headerTitle}>Biometric Scanner</Text>
          </View>
          <Text style={dynamicStyles.headerSubtitle}>
            {isProcessing 
              ? `Processing ${scanType}...` 
              : cameraActive 
                ? `Position ${scanType === 'Facial' ? 'your face' : 'document'} in frame` 
                : "Select scan type to begin"}
          </Text>
        </Animated.View>

        {/* Camera/Scan Frame Area */}
        <Animated.View 
          style={[
            dynamicStyles.scanArea,
            {
              opacity: frameAnim,
              transform: [{ scale: frameAnim }],
            },
          ]}
        >
          <View style={dynamicStyles.scanFrame}>
            {/* Camera View */}
            {cameraActive && permission?.granted ? (
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing={cameraFacing}
              />
            ) : (
              <View style={[dynamicStyles.cameraPlaceholder, { backgroundColor: colors.surfaceCard }]}>
                <Scan size={60} color={colors.primary + '40'} />
              </View>
            )}
            
            {/* Overlay frame */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {/* Corner markers */}
              <View style={[dynamicStyles.corner, dynamicStyles.topLeft, { borderColor: colors.primary }]} />
              <View style={[dynamicStyles.corner, dynamicStyles.topRight, { borderColor: colors.primary }]} />
              <View style={[dynamicStyles.corner, dynamicStyles.bottomLeft, { borderColor: colors.primary }]} />
              <View style={[dynamicStyles.corner, dynamicStyles.bottomRight, { borderColor: colors.primary }]} />
              
              {/* Scan line animation */}
              {isScanning && <ScanLine colors={colors} />}
            </View>
            
            {/* Center content when not using camera */}
            {!cameraActive && (
              <View style={dynamicStyles.centerContent}>
                <View style={[dynamicStyles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <Fingerprint size={50} color={colors.primary} />
                </View>
                <Text style={[dynamicStyles.scanHint, { color: colors.textMuted }]}>
                  Select scan type below
                </Text>
              </View>
            )}
            
            {/* Scanning indicator */}
            {(isScanning || isProcessing) && (
              <View style={dynamicStyles.scanningIndicator}>
                <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={dynamicStyles.scanningBadge}>
                  {isProcessing ? (
                    <>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[dynamicStyles.scanningText, { color: colors.text }]}>
                        Processing...
                      </Text>
                    </>
                  ) : (
                    <>
                      <CircleDot size={18} color={colors.success} />
                      <Text style={[dynamicStyles.scanningText, { color: colors.text }]}>
                        Camera Ready
                      </Text>
                    </>
                  )}
                </BlurView>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Scan Options */}
        {showOptions && (
          <ScrollView 
            style={dynamicStyles.optionsScrollView}
            contentContainerStyle={dynamicStyles.optionsContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={dynamicStyles.sectionTitle}>Choose Scan Type</Text>
            
            <ScanOption
              icon={Fingerprint}
              title="Fingerprint Scan"
              description="Scan and match biometric data"
              onPress={() => startScan("Fingerprint")}
              colors={colors}
              delay={100}
            />
            
            <ScanOption
              icon={CreditCard}
              title="ID Card Scan"
              description="Scan government issued ID"
              onPress={() => startScan("ID Card")}
              colors={colors}
              delay={200}
            />
            
            <ScanOption
              icon={User}
              title="Facial Recognition"
              description="Match face against database"
              onPress={() => startScan("Facial")}
              colors={colors}
              delay={300}
            />
          </ScrollView>
        )}

        {/* Camera Action Buttons */}
        {cameraActive && !isProcessing && (
          <View style={dynamicStyles.actionContainer}>
            {/* Camera controls row */}
            <View style={dynamicStyles.cameraControlsRow}>
              {/* Camera Switch Button for Facial Recognition */}
              {scanType === "Facial" && (
                <Pressable
                  onPress={toggleCameraFacing}
                  style={[dynamicStyles.controlButton, { backgroundColor: colors.surface }]}
                >
                  <SwitchCamera size={24} color={colors.primary} />
                </Pressable>
              )}
              
              {/* Capture Button */}
              <Pressable
                onPress={captureAndProcess}
                style={dynamicStyles.captureButtonOuter}
              >
                <LinearGradient
                  colors={[colors.primary, '#8B5CF6']}
                  style={dynamicStyles.captureButton}
                >
                  <View style={dynamicStyles.captureButtonInner}>
                    <Focus size={32} color="#fff" strokeWidth={2} />
                  </View>
                </LinearGradient>
              </Pressable>
              
              {/* Cancel Button */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  resetScan();
                }}
                style={[dynamicStyles.controlButton, { backgroundColor: colors.danger + '15' }]}
              >
                <X size={24} color={colors.danger} />
              </Pressable>
            </View>
            
            <Text style={dynamicStyles.captureHint}>Tap capture to scan</Text>
          </View>
        )}
        
        {/* Processing State */}
        {isProcessing && (
          <View style={dynamicStyles.actionContainer}>
            <View style={dynamicStyles.processingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[dynamicStyles.processingText, { color: colors.text }]}>
                Analyzing {scanType}...
              </Text>
            </View>
          </View>
        )}

        {/* Device Not Connected Modal */}
        <Portal>
          <Modal
            visible={showDeviceModal}
            onDismiss={() => setShowDeviceModal(false)}
            contentContainerStyle={[
              dynamicStyles.modalContainer,
              { backgroundColor: colors.surface }
            ]}
          >
            <View style={dynamicStyles.modalContent}>
              <View style={[dynamicStyles.resultIcon, { backgroundColor: colors.warning + '20' }]}>
                <Usb size={48} color={colors.warning} />
              </View>
              
              <Text style={dynamicStyles.modalTitle}>Device Not Connected</Text>
              <Text style={[dynamicStyles.modalSubtitle, { textAlign: 'center', paddingHorizontal: spacing.md }]}>
                Please connect your fingerprint scanner device to continue with biometric scanning.
              </Text>
              
              <Divider style={{ marginVertical: spacing.lg, backgroundColor: colors.border, width: '100%' }} />
              
              <View style={dynamicStyles.deviceInstructions}>
                <View style={dynamicStyles.instructionItem}>
                  <View style={[dynamicStyles.instructionNumber, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[dynamicStyles.instructionNumberText, { color: colors.primary }]}>1</Text>
                  </View>
                  <Text style={[dynamicStyles.instructionText, { color: colors.textSecondary }]}>
                    Connect the scanner via USB or Bluetooth
                  </Text>
                </View>
                <View style={dynamicStyles.instructionItem}>
                  <View style={[dynamicStyles.instructionNumber, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[dynamicStyles.instructionNumberText, { color: colors.primary }]}>2</Text>
                  </View>
                  <Text style={[dynamicStyles.instructionText, { color: colors.textSecondary }]}>
                    Wait for the device to be recognized
                  </Text>
                </View>
                <View style={dynamicStyles.instructionItem}>
                  <View style={[dynamicStyles.instructionNumber, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[dynamicStyles.instructionNumberText, { color: colors.primary }]}>3</Text>
                  </View>
                  <Text style={[dynamicStyles.instructionText, { color: colors.textSecondary }]}>
                    Try scanning again
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowDeviceModal(false);
                  setScanType(null);
                }}
                style={{ width: '100%', marginTop: spacing.md }}
              >
                <LinearGradient
                  colors={[colors.primary, '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={dynamicStyles.deviceModalButton}
                >
                  <Text style={dynamicStyles.modalButtonTextWhite}>Got it</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Modal>
        </Portal>

        {/* Result Modal */}
        <Portal>
          <Modal
            visible={showResultModal}
            onDismiss={() => setShowResultModal(false)}
            contentContainerStyle={[
              dynamicStyles.modalContainer,
              { backgroundColor: colors.surface }
            ]}
          >
            <View style={dynamicStyles.modalContent}>
              <View style={[dynamicStyles.resultIcon, { backgroundColor: colors.success + '20' }]}>
                <CheckCircle size={48} color={colors.success} />
              </View>
              
              <Text style={dynamicStyles.modalTitle}>Scan Complete</Text>
              <Text style={dynamicStyles.modalSubtitle}>
                {scanType} processed successfully
              </Text>
              
              <Divider style={{ marginVertical: spacing.md, backgroundColor: colors.border }} />
              
              <View style={dynamicStyles.resultDetails}>
                <View style={dynamicStyles.resultRow}>
                  <Text style={dynamicStyles.resultLabel}>Match Status</Text>
                  <Text style={[dynamicStyles.resultValue, { color: colors.success }]}>Found</Text>
                </View>
                <View style={dynamicStyles.resultRow}>
                  <Text style={dynamicStyles.resultLabel}>Confidence</Text>
                  <Text style={dynamicStyles.resultValue}>94.7%</Text>
                </View>
                <View style={dynamicStyles.resultRow}>
                  <Text style={dynamicStyles.resultLabel}>Scan Type</Text>
                  <Text style={dynamicStyles.resultValue}>{scanType}</Text>
                </View>
                <View style={dynamicStyles.resultRow}>
                  <Text style={dynamicStyles.resultLabel}>Processing Time</Text>
                  <Text style={dynamicStyles.resultValue}>3.2s</Text>
                </View>
              </View>

              <View style={dynamicStyles.modalActions}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowResultModal(false);
                    // Reset to show options again
                    setShowOptions(true);
                    setScanType(null);
                  }}
                  style={[dynamicStyles.modalButtonOutline, { borderColor: colors.border }]}
                >
                  <X size={16} color={colors.text} />
                  <Text style={[dynamicStyles.modalButtonText, { color: colors.text }]}>
                    Go Back
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowResultModal(false);
                    resetScan();
                  }}
                >
                  <LinearGradient
                    colors={colors.gradients?.primary || [colors.primary, colors.primary]}
                    style={dynamicStyles.modalButtonFilled}
                  >
                    <RefreshCw size={16} color="#fff" />
                    <Text style={dynamicStyles.modalButtonTextWhite}>New Scan</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Modal>
        </Portal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scanLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    borderRadius: 1,
    opacity: 0.9,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  optionBlur: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  optionDescription: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.8,
  },
});

const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  permissionText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxs,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    opacity: 0.9,
  },
  scanArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE * 0.72,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.xxl || 24,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 3,
  },
  topLeft: {
    top: 12,
    left: 12,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 12,
    right: 12,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 12,
    left: 12,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 12,
    right: 12,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12,
  },
  centerContent: {
    alignItems: 'center',
    position: 'absolute',
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scanHint: {
    fontSize: 14,
    fontWeight: '500',
  },
  scanningIndicator: {
    position: 'absolute',
    bottom: spacing.lg,
    alignItems: 'center',
  },
  scanningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    gap: spacing.sm,
  },
  scanningText: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionsScrollView: {
    flex: 1,
  },
  optionsContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  cameraControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  captureButtonOuter: {
    padding: 4,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.md,
    fontWeight: '500',
  },
  processingContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchCameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  switchCameraText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.danger,
    backgroundColor: colors.danger + '10',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  deviceInstructions: {
    width: '100%',
    gap: spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  deviceModalButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    margin: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  modalContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  resultDetails: {
    width: '100%',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  resultLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
    width: '100%',
  },
  modalButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minWidth: 120,
  },
  modalButtonFilled: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 120,
  },
  modalButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalButtonTextWhite: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
