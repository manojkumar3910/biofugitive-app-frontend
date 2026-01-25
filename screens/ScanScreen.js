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
  Image,
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
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { 
  Camera, 
  Fingerprint, 
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
  Upload,
  FileImage,
  XCircle,
} from "lucide-react-native";
import { useAppTheme } from "../context/ThemeContext";
import { useActivity } from "../context/ActivityContext";
import { spacing, borderRadius, shadows, typography } from "../theme";
import { API_BASE_URL } from "../config/api";

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fingerprintMatchResult, setFingerprintMatchResult] = useState(null);
  const [faceMatchResult, setFaceMatchResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
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
    
    // Check camera permission for all scan types
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
    // Use back camera for fingerprint scanning
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
    // Show warning for facial recognition to remove obstructions
    if (scanType === "Facial") {
      Alert.alert(
        "📸 Before Capturing",
        "For accurate face recognition, please ensure:\n\n• Remove masks\n• Remove glasses/sunglasses\n• Face the camera directly\n• Ensure good lighting",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Capture",
            onPress: () => proceedWithCapture()
          }
        ]
      );
      return;
    }
    
    // For non-facial scans, proceed directly
    proceedWithCapture();
  };

  const proceedWithCapture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsProcessing(true);
    
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          base64: true,
        });
        console.log("Photo captured:", photo.uri);
        
        // If it's a fingerprint scan, send to matching API
        if (scanType === "Fingerprint") {
          try {
            console.log("Sending fingerprint to matching API...");
            const response = await fetch(`${API_BASE_URL}/fingerprint-match`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fingerprint: photo.base64,
                filename: `camera_scan_${Date.now()}.jpg`,
              }),
            });

            const data = await response.json();
            console.log("Fingerprint match result:", data);

            if (response.ok) {
              setFingerprintMatchResult(data);
              Haptics.notificationAsync(
                data.matchFound 
                  ? Haptics.NotificationFeedbackType.Success 
                  : Haptics.NotificationFeedbackType.Warning
              );
              addActivity(
                data.matchFound ? 'FINGERPRINT_MATCH_FOUND' : 'FINGERPRINT_NO_MATCH',
                { 
                  message: data.matchFound 
                    ? `Match found: ${data.matchedPerson?.name} (Score: ${data.score})`
                    : 'No fingerprint match found'
                }
              );
              
              setIsProcessing(false);
              setIsScanning(false);
              setCameraActive(false);
              setShowUploadModal(true); // Reuse upload modal to show results
              return;
            } else {
              throw new Error(data.message || 'Fingerprint matching failed');
            }
          } catch (matchError) {
            console.error("Fingerprint matching error:", matchError);
            Alert.alert("Error", `Fingerprint matching failed: ${matchError.message}`);
            addActivity('SCAN_FAILED', { message: `Fingerprint matching failed - ${matchError.message}` });
            setIsProcessing(false);
            setIsScanning(false);
            setCameraActive(false);
            setShowOptions(true);
            return;
          }
        }
        
        // If it's a facial recognition scan, send to face-match API (DeepFace)
        if (scanType === "Facial") {
          try {
            console.log("Sending face image to DeepFace matching API...");
            const response = await fetch(`${API_BASE_URL}/face-match`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                faceImage: photo.base64,
                filename: `face_scan_${Date.now()}.jpg`,
              }),
            });

            const data = await response.json();
            console.log("Face match result:", data);

            if (response.ok) {
              setFaceMatchResult(data);
              Haptics.notificationAsync(
                data.matchFound 
                  ? Haptics.NotificationFeedbackType.Success 
                  : Haptics.NotificationFeedbackType.Warning
              );
              addActivity(
                data.matchFound ? 'FACE_MATCH_FOUND' : 'FACE_NO_MATCH',
                { 
                  message: data.matchFound 
                    ? `Match found: ${data.matchedPerson?.name} (Confidence: ${data.confidence}%)`
                    : 'No face match found'
                }
              );
              
              setIsProcessing(false);
              setIsScanning(false);
              setCameraActive(false);
              setShowResultModal(true); // Show result modal for face recognition
              return;
            } else {
              throw new Error(data.message || 'Face matching failed');
            }
          } catch (matchError) {
            console.error("Face matching error:", matchError);
            Alert.alert("Error", `Face matching failed: ${matchError.message}`);
            addActivity('SCAN_FAILED', { message: `Face matching failed - ${matchError.message}` });
            setIsProcessing(false);
            setIsScanning(false);
            setCameraActive(false);
            setShowOptions(true);
            return;
          }
        }
        
        // Log successful scan for other types
        addActivity('SCAN_SUCCESS', { message: `${scanType} scan completed successfully` });
        
        // For other scan types, show result modal after delay
        setTimeout(() => {
          setIsProcessing(false);
          setIsScanning(false);
          setCameraActive(false);
          setShowResultModal(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1000);
      } catch (error) {
        console.error("Error capturing photo:", error);
        addActivity('SCAN_FAILED', { message: `${scanType} scan failed - ${error.message}` });
        setIsProcessing(false);
        setIsScanning(false);
        setCameraActive(false);
        setShowOptions(true);
      }
    } else {
      setIsProcessing(false);
      setIsScanning(false);
      setCameraActive(false);
      setShowOptions(true);
    }
  };

  const resetScan = () => {
    setShowResultModal(false);
    setShowDeviceModal(false);
    setShowUploadModal(false);
    setScanType(null);
    setIsScanning(false);
    setIsProcessing(false);
    setCameraActive(false);
    setCameraFacing('front');
    setSelectedFile(null);
    setFingerprintMatchResult(null);
    setFaceMatchResult(null);
    setIsUploading(false);
    // Delay showing options to allow modal to close
    setTimeout(() => {
      setShowOptions(true);
    }, 100);
  };

  // Handle fingerprint file upload
  const pickFingerprintFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/bmp', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        addActivity('FILE_SELECTED', { message: `Fingerprint file selected: ${file.name}` });
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Error", "Failed to select file. Please try again.");
    }
  };

  // Upload and match fingerprint
  const uploadAndMatchFingerprint = async () => {
    if (!selectedFile) {
      Alert.alert("No File", "Please select a fingerprint image first.");
      return;
    }

    setIsUploading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      console.log("Selected file:", selectedFile);
      
      // Get the file URI - handle different formats
      let fileUri = selectedFile.uri;
      
      // For Android content:// URIs, we need to copy to cache first
      if (fileUri.startsWith('content://')) {
        const cacheUri = FileSystem.cacheDirectory + selectedFile.name;
        await FileSystem.copyAsync({
          from: fileUri,
          to: cacheUri,
        });
        fileUri = cacheUri;
      }

      // Read file as base64 - use string 'base64' instead of EncodingType.Base64
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
      });

      if (!base64) {
        throw new Error("Failed to read file content");
      }

      console.log("Base64 length:", base64.length);

      // Send to backend for matching
      const response = await fetch(`${API_BASE_URL}/fingerprint-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fingerprint: base64,
          filename: selectedFile.name,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFingerprintMatchResult(data);
        Haptics.notificationAsync(
          data.matchFound 
            ? Haptics.NotificationFeedbackType.Success 
            : Haptics.NotificationFeedbackType.Warning
        );
        addActivity(
          data.matchFound ? 'FINGERPRINT_MATCH_FOUND' : 'FINGERPRINT_NO_MATCH',
          { 
            message: data.matchFound 
              ? `Match found: ${data.matchedPerson?.name} (Score: ${data.score})`
              : 'No fingerprint match found'
          }
        );
      } else {
        throw new Error(data.message || 'Failed to match fingerprint');
      }
    } catch (error) {
      console.error("Fingerprint matching error:", error);
      Alert.alert("Error", error.message || "Failed to process fingerprint. Please try again.");
      addActivity('FINGERPRINT_MATCH_ERROR', { message: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  // Open fingerprint upload modal
  const openFingerprintUpload = () => {
    setScanType("Fingerprint Upload");
    setShowOptions(false);
    setShowUploadModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addActivity('FINGERPRINT_UPLOAD_STARTED', { message: 'Fingerprint upload initiated' });
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
              icon={Upload}
              title="Upload Fingerprint"
              description="Upload .bmp file to find match"
              onPress={openFingerprintUpload}
              colors={colors}
              delay={100}
            />
            
            <ScanOption
              icon={Fingerprint}
              title="Fingerprint Scan"
              description="Scan and match biometric data"
              onPress={() => startScan("Fingerprint")}
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
              {/* Dynamic icon based on match result */}
              {scanType === "Facial" && faceMatchResult ? (
                <View style={[
                  dynamicStyles.resultIcon, 
                  { backgroundColor: faceMatchResult.matchFound ? colors.success + '20' : colors.warning + '20' }
                ]}>
                  {faceMatchResult.matchFound ? (
                    <CheckCircle size={48} color={colors.success} />
                  ) : (
                    <AlertCircle size={48} color={colors.warning} />
                  )}
                </View>
              ) : (
                <View style={[dynamicStyles.resultIcon, { backgroundColor: colors.success + '20' }]}>
                  <CheckCircle size={48} color={colors.success} />
                </View>
              )}
              
              <Text style={dynamicStyles.modalTitle}>
                {scanType === "Facial" && faceMatchResult 
                  ? (faceMatchResult.matchFound ? "Match Found!" : "No Match Found")
                  : "Scan Complete"}
              </Text>
              <Text style={dynamicStyles.modalSubtitle}>
                {scanType === "Facial" && faceMatchResult
                  ? (faceMatchResult.matchFound 
                      ? `Identified: ${faceMatchResult.matchedPerson?.name || 'Unknown'}`
                      : faceMatchResult.message || "No matching person in database")
                  : `${scanType} processed successfully`}
              </Text>
              
              <Divider style={{ marginVertical: spacing.md, backgroundColor: colors.border }} />
              
              <View style={dynamicStyles.resultDetails}>
                {/* Face Recognition Results */}
                {scanType === "Facial" && faceMatchResult ? (
                  <>
                    <View style={dynamicStyles.resultRow}>
                      <Text style={dynamicStyles.resultLabel}>Match Status</Text>
                      <Text style={[
                        dynamicStyles.resultValue, 
                        { color: faceMatchResult.matchFound ? colors.success : colors.warning }
                      ]}>
                        {faceMatchResult.matchFound ? "Found" : "Not Found"}
                      </Text>
                    </View>
                    {faceMatchResult.matchFound && faceMatchResult.matchedPerson && (
                      <>
                        <View style={dynamicStyles.resultRow}>
                          <Text style={dynamicStyles.resultLabel}>Person ID</Text>
                          <Text style={dynamicStyles.resultValue}>
                            {faceMatchResult.matchedPerson.personId || "N/A"}
                          </Text>
                        </View>
                        <View style={dynamicStyles.resultRow}>
                          <Text style={dynamicStyles.resultLabel}>Name</Text>
                          <Text style={dynamicStyles.resultValue}>
                            {faceMatchResult.matchedPerson.name || "Unknown"}
                          </Text>
                        </View>
                      </>
                    )}
                    <View style={dynamicStyles.resultRow}>
                      <Text style={dynamicStyles.resultLabel}>Confidence</Text>
                      <Text style={dynamicStyles.resultValue}>
                        {faceMatchResult.confidence ? `${faceMatchResult.confidence}%` : "N/A"}
                      </Text>
                    </View>
                    <View style={dynamicStyles.resultRow}>
                      <Text style={dynamicStyles.resultLabel}>Faces Compared</Text>
                      <Text style={dynamicStyles.resultValue}>
                        {faceMatchResult.totalCompared || 0}
                      </Text>
                    </View>
                    <View style={dynamicStyles.resultRow}>
                      <Text style={dynamicStyles.resultLabel}>Processing Time</Text>
                      <Text style={dynamicStyles.resultValue}>
                        {faceMatchResult.processingTime 
                          ? `${(faceMatchResult.processingTime / 1000).toFixed(1)}s`
                          : "N/A"}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </View>

              <View style={dynamicStyles.modalActions}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowResultModal(false);
                    // Reset to show options again
                    setShowOptions(true);
                    setScanType(null);
                    setFaceMatchResult(null);
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

        {/* Fingerprint Upload Modal */}
        <Portal>
          <Modal
            visible={showUploadModal}
            onDismiss={() => {
              if (!isUploading) {
                setShowUploadModal(false);
                resetScan();
              }
            }}
            contentContainerStyle={[
              dynamicStyles.modalContainer,
              { backgroundColor: colors.surface, maxHeight: '90%' }
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={dynamicStyles.modalContent}>
                {/* Header */}
                <View style={[dynamicStyles.resultIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Upload size={48} color={colors.primary} />
                </View>
                
                <Text style={dynamicStyles.modalTitle}>Upload Fingerprint</Text>
                <Text style={[dynamicStyles.modalSubtitle, { textAlign: 'center' }]}>
                  Select a .bmp fingerprint image to find matches in the database
                </Text>
                
                <Divider style={{ marginVertical: spacing.lg, backgroundColor: colors.border, width: '100%' }} />
                
                {/* File Selection Area */}
                <Pressable
                  onPress={pickFingerprintFile}
                  disabled={isUploading}
                  style={[
                    dynamicStyles.uploadArea,
                    { 
                      borderColor: selectedFile ? colors.success : colors.border,
                      backgroundColor: selectedFile ? colors.success + '10' : colors.surfaceCard,
                    }
                  ]}
                >
                  {selectedFile ? (
                    <View style={dynamicStyles.selectedFileContainer}>
                      <FileImage size={40} color={colors.success} />
                      <Text style={[dynamicStyles.selectedFileName, { color: colors.text }]} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Text style={[dynamicStyles.selectedFileSize, { color: colors.textSecondary }]}>
                        {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(2)} KB` : 'File selected'}
                      </Text>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setFingerprintMatchResult(null);
                        }}
                        style={dynamicStyles.removeFileButton}
                      >
                        <XCircle size={20} color={colors.danger} />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={dynamicStyles.uploadPlaceholder}>
                      <FileImage size={48} color={colors.textMuted} />
                      <Text style={[dynamicStyles.uploadText, { color: colors.text }]}>
                        Tap to select fingerprint image
                      </Text>
                      <Text style={[dynamicStyles.uploadHint, { color: colors.textMuted }]}>
                        Supports .bmp and other image formats
                      </Text>
                    </View>
                  )}
                </Pressable>

                {/* Match Results */}
                {fingerprintMatchResult && (
                  <View style={dynamicStyles.matchResultContainer}>
                    <View style={[
                      dynamicStyles.matchResultHeader,
                      { backgroundColor: fingerprintMatchResult.matchFound ? colors.success + '20' : colors.warning + '20' }
                    ]}>
                      {fingerprintMatchResult.matchFound ? (
                        <CheckCircle size={24} color={colors.success} />
                      ) : (
                        <AlertCircle size={24} color={colors.warning} />
                      )}
                      <Text style={[
                        dynamicStyles.matchResultTitle,
                        { color: fingerprintMatchResult.matchFound ? colors.success : colors.warning }
                      ]}>
                        {fingerprintMatchResult.matchFound ? 'Match Found!' : 'No Match Found'}
                      </Text>
                    </View>
                    
                    {fingerprintMatchResult.matchFound && fingerprintMatchResult.matchedPerson && (
                      <View style={dynamicStyles.matchedPersonDetails}>
                        <View style={dynamicStyles.resultRow}>
                          <Text style={dynamicStyles.resultLabel}>Name</Text>
                          <Text style={dynamicStyles.resultValue}>{fingerprintMatchResult.matchedPerson.name}</Text>
                        </View>
                        <View style={dynamicStyles.resultRow}>
                          <Text style={dynamicStyles.resultLabel}>Person ID</Text>
                          <Text style={dynamicStyles.resultValue}>{fingerprintMatchResult.matchedPerson.personId}</Text>
                        </View>
                        <View style={dynamicStyles.resultRow}>
                          <Text style={dynamicStyles.resultLabel}>Match Score</Text>
                          <Text style={[dynamicStyles.resultValue, { color: colors.success }]}>
                            {fingerprintMatchResult.score?.toFixed(2)}
                          </Text>
                        </View>
                        {fingerprintMatchResult.matchedPerson.gender && (
                          <View style={dynamicStyles.resultRow}>
                            <Text style={dynamicStyles.resultLabel}>Gender</Text>
                            <Text style={dynamicStyles.resultValue}>{fingerprintMatchResult.matchedPerson.gender}</Text>
                          </View>
                        )}
                        {fingerprintMatchResult.matchedPerson.age && (
                          <View style={dynamicStyles.resultRow}>
                            <Text style={dynamicStyles.resultLabel}>Age</Text>
                            <Text style={dynamicStyles.resultValue}>{fingerprintMatchResult.matchedPerson.age}</Text>
                          </View>
                        )}
                        {fingerprintMatchResult.matchedFinger && (
                          <View style={dynamicStyles.resultRow}>
                            <Text style={dynamicStyles.resultLabel}>Matched Finger</Text>
                            <Text style={dynamicStyles.resultValue}>
                              {fingerprintMatchResult.matchedFinger.hand} {fingerprintMatchResult.matchedFinger.finger}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                    
                    {!fingerprintMatchResult.matchFound && (
                      <View style={dynamicStyles.noMatchMessage}>
                        <Text style={[dynamicStyles.noMatchText, { color: colors.textSecondary }]}>
                          The uploaded fingerprint did not match any records in the database.
                          {fingerprintMatchResult.bestScore > 0 && (
                            `\n\nBest score: ${fingerprintMatchResult.bestScore?.toFixed(2)} (threshold: 40)`
                          )}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={[dynamicStyles.modalActions, { marginTop: spacing.lg }]}>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowUploadModal(false);
                      resetScan();
                    }}
                    disabled={isUploading}
                    style={[dynamicStyles.modalButtonOutline, { borderColor: colors.border, opacity: isUploading ? 0.5 : 1 }]}
                  >
                    <X size={16} color={colors.text} />
                    <Text style={[dynamicStyles.modalButtonText, { color: colors.text }]}>
                      Cancel
                    </Text>
                  </Pressable>
                  
                  <Pressable
                    onPress={uploadAndMatchFingerprint}
                    disabled={!selectedFile || isUploading}
                  >
                    <LinearGradient
                      colors={(!selectedFile || isUploading) 
                        ? [colors.textMuted, colors.textMuted] 
                        : [colors.primary, '#8B5CF6']}
                      style={[dynamicStyles.modalButtonFilled, { opacity: (!selectedFile || isUploading) ? 0.5 : 1 }]}
                    >
                      {isUploading ? (
                        <>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={dynamicStyles.modalButtonTextWhite}>Matching...</Text>
                        </>
                      ) : (
                        <>
                          <Fingerprint size={16} color="#fff" />
                          <Text style={dynamicStyles.modalButtonTextWhite}>Find Match</Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
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
  // Upload Modal Styles
  uploadArea: {
    width: '100%',
    minHeight: 150,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  uploadHint: {
    fontSize: 12,
  },
  selectedFileContainer: {
    alignItems: 'center',
    gap: spacing.sm,
    position: 'relative',
    width: '100%',
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '80%',
  },
  selectedFileSize: {
    fontSize: 12,
  },
  removeFileButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    padding: spacing.xs,
  },
  matchResultContainer: {
    width: '100%',
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  matchResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  matchResultTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  matchedPersonDetails: {
    padding: spacing.md,
    backgroundColor: colors.surfaceCard,
  },
  noMatchMessage: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceCard,
  },
  noMatchText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
