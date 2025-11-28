import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Surface, 
  Portal, 
  Modal, 
  Chip,
  Divider,
  IconButton,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { 
  User, 
  MapPin, 
  CreditCard, 
  Fingerprint,
  X,
  Calendar,
  ChevronLeft,
  Hash,
} from "lucide-react-native";
import { useAppTheme } from "../context/ThemeContext";
import { spacing, borderRadius } from "../theme";
import { API_ENDPOINTS } from "../config/api";

const { width } = Dimensions.get("window");

export default function PersonDetailScreen({ route, navigation }) {
  const { colors } = useAppTheme();
  const { person } = route.params;
  
  // Fingerprint viewer state
  const [fingerprintViewerVisible, setFingerprintViewerVisible] = useState(false);
  const [selectedFingerprint, setSelectedFingerprint] = useState(null);
  
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isMale = person.gender?.toLowerCase() === "male";
  const accentColor = isMale ? colors.primary : colors.accent || "#E91E63";

  const dynamicStyles = createStyles(colors);

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['bottom']}>
      <View style={dynamicStyles.container}>
        {/* Custom Header */}
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
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              navigation.goBack();
            }}
            style={dynamicStyles.backButton}
          >
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={dynamicStyles.headerTitle}>Person Details</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView 
          style={dynamicStyles.scrollView}
          contentContainerStyle={dynamicStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: contentAnim,
              transform: [{
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            }}
          >
            {/* Profile Header */}
            <View style={dynamicStyles.profileHeader}>
              <View style={[dynamicStyles.profileAvatar, { backgroundColor: accentColor + "20" }]}>
                <User size={50} color={accentColor} strokeWidth={1.5} />
              </View>
              <Text style={dynamicStyles.profileName}>{person.name}</Text>
              <View style={dynamicStyles.profileBadges}>
                <Chip 
                  mode="flat" 
                  compact
                  style={{ backgroundColor: colors.primary + "20" }}
                  textStyle={{ color: colors.primary, fontSize: 12 }}
                  icon={() => <Hash size={12} color={colors.primary} />}
                >
                  ID: {person.personId}
                </Chip>
                <Chip 
                  mode="flat" 
                  compact
                  style={{ 
                    backgroundColor: accentColor + "20",
                    marginLeft: 8,
                  }}
                  textStyle={{ color: accentColor, fontSize: 12 }}
                >
                  {person.gender}
                </Chip>
              </View>
            </View>

            {/* Details Card */}
            <Surface style={dynamicStyles.detailsCard} elevation={1}>
              <Text style={dynamicStyles.sectionLabel}>Personal Information</Text>
              
              <View style={dynamicStyles.detailRow}>
                <View style={[dynamicStyles.detailIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Calendar size={18} color={colors.primary} />
                </View>
                <View style={dynamicStyles.detailContent}>
                  <Text style={dynamicStyles.detailLabel}>Age</Text>
                  <Text style={dynamicStyles.detailValue}>{person.age} years</Text>
                </View>
              </View>

              <Divider style={dynamicStyles.divider} />

              <View style={dynamicStyles.detailRow}>
                <View style={[dynamicStyles.detailIcon, { backgroundColor: colors.primary + "15" }]}>
                  <MapPin size={18} color={colors.primary} />
                </View>
                <View style={dynamicStyles.detailContent}>
                  <Text style={dynamicStyles.detailLabel}>Address</Text>
                  <Text style={dynamicStyles.detailValue}>{person.address}</Text>
                </View>
              </View>

              <Divider style={dynamicStyles.divider} />

              <View style={dynamicStyles.detailRow}>
                <View style={[dynamicStyles.detailIcon, { backgroundColor: colors.primary + "15" }]}>
                  <CreditCard size={18} color={colors.primary} />
                </View>
                <View style={dynamicStyles.detailContent}>
                  <Text style={dynamicStyles.detailLabel}>Aadhaar Number</Text>
                  <Text style={dynamicStyles.detailValue}>{person.aadhaar}</Text>
                </View>
              </View>
            </Surface>

            {/* Fingerprints Section */}
            <Surface style={dynamicStyles.fingerprintCard} elevation={1}>
              <View style={dynamicStyles.fingerprintHeader}>
                <View style={dynamicStyles.fingerprintHeaderLeft}>
                  <Fingerprint size={20} color={colors.primary} />
                  <Text style={dynamicStyles.sectionLabel}>Fingerprint Records</Text>
                </View>
                <Chip 
                  mode="flat" 
                  compact
                  style={{ backgroundColor: colors.success + "20" }}
                  textStyle={{ color: colors.success, fontSize: 11 }}
                >
                  {person.fingers?.length || 0} records
                </Chip>
              </View>

              <Text style={dynamicStyles.tapHint}>
                Tap any fingerprint to view full size
              </Text>

              {/* Fingerprint Grid */}
              <View style={dynamicStyles.fingerprintGrid}>
                {person.fingers?.map((finger, idx) => {
                  const imageUrl = `${API_ENDPOINTS.FINGERPRINTS}/${finger.filename}`;
                  
                  return (
                    <Pressable 
                      key={idx} 
                      style={[dynamicStyles.fingerprintItem, { backgroundColor: colors.background }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedFingerprint({
                          ...finger,
                          personName: person.name,
                          personId: person.personId,
                        });
                        setFingerprintViewerVisible(true);
                      }}
                    >
                      <Image
                        source={{ uri: imageUrl }}
                        style={dynamicStyles.fingerprintImage}
                        resizeMode="cover"
                      />
                      <Text style={dynamicStyles.fingerprintLabel}>
                        {finger.hand} {finger.finger}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Surface>
          </Animated.View>
        </ScrollView>

        {/* Fingerprint Full View Modal */}
        <Portal>
          <Modal
            visible={fingerprintViewerVisible}
            onDismiss={() => setFingerprintViewerVisible(false)}
            contentContainerStyle={[
              dynamicStyles.modalContainer,
              { backgroundColor: colors.background }
            ]}
          >
            {selectedFingerprint && (
              <View style={dynamicStyles.modalContent}>
                {/* Modal Header */}
                <View style={dynamicStyles.modalHeader}>
                  <View>
                    <Text style={dynamicStyles.modalTitle}>
                      {selectedFingerprint.hand} {selectedFingerprint.finger}
                    </Text>
                    <Text style={dynamicStyles.modalSubtitle}>
                      {selectedFingerprint.personName} (ID: {selectedFingerprint.personId})
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFingerprintViewerVisible(false);
                    }}
                    style={[dynamicStyles.modalCloseButton, { backgroundColor: colors.surface }]}
                  >
                    <X size={24} color={colors.text} />
                  </Pressable>
                </View>

                {/* Large Fingerprint Image */}
                <View style={[dynamicStyles.modalImageContainer, { backgroundColor: colors.surface }]}>
                  <Image
                    source={{ uri: `${API_ENDPOINTS.FINGERPRINTS}/${selectedFingerprint.filename}` }}
                    style={dynamicStyles.modalImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Info Footer */}
                <View style={[dynamicStyles.modalFooter, { backgroundColor: colors.surface }]}>
                  <View style={dynamicStyles.modalFooterInfo}>
                    <Fingerprint size={20} color={colors.primary} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={dynamicStyles.modalFooterLabel}>Filename</Text>
                      <Text style={dynamicStyles.modalFooterValue}>
                        {selectedFingerprint.filename}
                      </Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFingerprintViewerVisible(false);
                  }}
                >
                  <LinearGradient
                    colors={colors.gradients?.primary || [colors.primary, colors.primary]}
                    style={dynamicStyles.modalButton}
                  >
                    <Text style={dynamicStyles.modalButtonText}>Close</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </Modal>
        </Portal>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  profileBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginTop: 2,
  },
  divider: {
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  fingerprintCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  fingerprintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  fingerprintHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tapHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  fingerprintGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  fingerprintItem: {
    width: (width - spacing.lg * 4 - spacing.sm * 4) / 5,
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    alignItems: 'center',
  },
  fingerprintImage: {
    width: '100%',
    height: '75%',
    backgroundColor: '#f0f0f0',
  },
  fingerprintLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 2,
  },
  // Modal Styles
  modalContainer: {
    margin: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  modalContent: {
    paddingBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImageContainer: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalImage: {
    width: width - spacing.lg * 4 - spacing.md * 2,
    height: width - spacing.lg * 4 - spacing.md * 2,
    maxHeight: 350,
  },
  modalFooter: {
    margin: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  modalFooterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalFooterLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalFooterValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    marginTop: 2,
  },
  modalButton: {
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
