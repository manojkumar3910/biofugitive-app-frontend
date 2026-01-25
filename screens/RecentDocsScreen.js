import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  RefreshControl,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Searchbar, 
  Surface, 
  Portal, 
  Modal, 
  Button,
  Chip,
  Divider,
  IconButton,
} from "react-native-paper";
import { User, MapPin, CreditCard, Fingerprint, Clock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { useAppTheme } from "../context/ThemeContext";
import { spacing, borderRadius, shadows, typography } from "../theme";
import { API_ENDPOINTS } from "../config/api";

const RECENT_PERSONS_KEY = "@recent_viewed_persons";

// Skeleton loader component
function SkeletonLoader({ colors }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((item) => (
        <Animated.View
          key={item}
          style={[
            styles.skeletonItem,
            { 
              backgroundColor: colors.shimmer,
              opacity,
            },
          ]}
        >
          <View style={styles.skeletonHeader}>
            <View style={[styles.skeletonAvatar, { backgroundColor: colors.border }]} />
            <View style={{ flex: 1 }}>
              <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '60%' }]} />
              <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '40%', marginTop: 8 }]} />
            </View>
          </View>
          <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '80%', marginTop: 12 }]} />
          <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '50%', marginTop: 8 }]} />
        </Animated.View>
      ))}
    </View>
  );
}

// Fingerprint image component with loading state
function FingerprintImage({ filename, colors, size = 60 }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const imageUrl = `${API_ENDPOINTS.FINGERPRINTS}/${filename}`;

  if (error) {
    return (
      <View style={[styles.fingerprintPlaceholder, { width: size, height: size, backgroundColor: colors.border }]}>
        <Fingerprint size={size * 0.5} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <View style={[styles.fingerprintContainer, { width: size, height: size }]}>
      {loading && (
        <View style={[styles.fingerprintLoading, { backgroundColor: colors.border }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <Image
        source={{ uri: imageUrl }}
        style={[styles.fingerprintImage, { width: size, height: size }]}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        resizeMode="cover"
      />
    </View>
  );
}

// Person card component with animation
function PersonCard({ item, onPress, index, colors, viewedAt }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Get first fingerprint for thumbnail
  const firstFinger = item.fingers?.[0];
  const filename = firstFinger?.imagePath?.split('\\').pop() || firstFinger?.imagePath?.split('/').pop();

  // Mask Aadhaar - show only last 4 digits
  const maskedAadhaar = item.aadhaar 
    ? `XXXX XXXX ${item.aadhaar.toString().slice(-4)}`
    : 'N/A';

  // Format viewed time
  const formatViewedTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const viewed = new Date(timestamp);
    const diffMs = now - viewed;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Animated.View
      style={{
        opacity: scaleAnim,
        transform: [
          { scale: Animated.multiply(scaleAnim, pressScale) },
          {
            translateY: scaleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(item);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Surface style={[styles.personCard, { backgroundColor: colors.surface }]} elevation={1}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Chip 
                mode="flat" 
                compact
                style={{ backgroundColor: colors.accent + '30' }}
                textStyle={{ color: colors.accent, fontSize: 11 }}
                icon={() => <Clock size={12} color={colors.accent} />}
              >
                {formatViewedTime(viewedAt)}
              </Chip>
            </View>
            <Chip 
              mode="outlined" 
              compact
              style={{ borderColor: colors.primary }}
              textStyle={{ color: colors.primary, fontSize: 11 }}
            >
              ID: {item.personId}
            </Chip>
          </View>

          <View style={styles.cardBody}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
              <User size={28} color={colors.primary} />
            </View>
            
            <View style={styles.personInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.personName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Chip 
                  mode="flat" 
                  compact
                  style={{ 
                    backgroundColor: item.gender === 'Male' ? '#3498db20' : '#e91e6320',
                    marginLeft: 8,
                  }}
                  textStyle={{ 
                    color: item.gender === 'Male' ? '#3498db' : '#e91e63', 
                    fontSize: 10 
                  }}
                >
                  {item.gender} • {item.age}y
                </Chip>
              </View>
              
              <View style={styles.detailRow}>
                <MapPin size={14} color={colors.textSecondary} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <CreditCard size={14} color={colors.textSecondary} />
                <Text style={[styles.aadhaarText, { color: colors.textSecondary }]}>
                  {maskedAadhaar}
                </Text>
              </View>
            </View>

            {filename && (
              <View style={styles.thumbnailContainer}>
                <FingerprintImage filename={filename} colors={colors} size={50} />
              </View>
            )}
          </View>
        </Surface>
      </Pressable>
    </Animated.View>
  );
}

export default function RecentDocsScreen() {
  const { colors } = useAppTheme();
  const route = useRoute();
  
  const [recentPersons, setRecentPersons] = useState([]);
  const [filteredPersons, setFilteredPersons] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  // Load recent persons from AsyncStorage
  const loadRecentPersons = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_PERSONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sort by viewedAt descending (most recent first)
        const sorted = parsed.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
        setRecentPersons(sorted);
        setFilteredPersons(sorted);
      }
    } catch (error) {
      console.error('Error loading recent persons:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if new person was passed via route params
  useEffect(() => {
    if (route.params?.selectedPerson) {
      addToRecent(route.params.selectedPerson);
    }
  }, [route.params?.selectedPerson]);

  // Add person to recent list
  const addToRecent = async (person) => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_PERSONS_KEY);
      let recentList = stored ? JSON.parse(stored) : [];
      
      // Remove if already exists (to update position)
      recentList = recentList.filter(p => p.personId !== person.personId);
      
      // Add to beginning with timestamp
      recentList.unshift({
        ...person,
        viewedAt: new Date().toISOString(),
      });
      
      // Keep only last 50 items
      if (recentList.length > 50) {
        recentList = recentList.slice(0, 50);
      }
      
      await AsyncStorage.setItem(RECENT_PERSONS_KEY, JSON.stringify(recentList));
      setRecentPersons(recentList);
      setFilteredPersons(recentList);
    } catch (error) {
      console.error('Error adding to recent:', error);
    }
  };

  // Reload when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadRecentPersons();
    }, [loadRecentPersons])
  );

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadRecentPersons();
    setRefreshing(false);
  }, [loadRecentPersons]);

  const handleSearch = (text) => {
    setSearch(text);
    if (!text.trim()) {
      setFilteredPersons(recentPersons);
      return;
    }
    const searchLower = text.toLowerCase();
    const filtered = recentPersons.filter(
      (person) =>
        person.name?.toLowerCase().includes(searchLower) ||
        person.personId?.toString().includes(text) ||
        person.address?.toLowerCase().includes(searchLower)
    );
    setFilteredPersons(filtered);
  };

  const openModal = (person) => {
    setSelectedPerson(person);
    setModalVisible(true);
  };

  const clearHistory = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await AsyncStorage.removeItem(RECENT_PERSONS_KEY);
      setRecentPersons([]);
      setFilteredPersons([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const renderItem = ({ item, index }) => (
    <PersonCard 
      item={item} 
      onPress={openModal} 
      index={index}
      colors={colors}
      viewedAt={item.viewedAt}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
        <Clock size={48} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {search ? "No results found" : "No recent activity"}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {search 
          ? "Try adjusting your search terms" 
          : "View person records from Documents tab to see them here"}
      </Text>
    </View>
  );

  // Render fingerprint grid in modal
  const renderFingerprintGrid = () => {
    if (!selectedPerson?.fingers || selectedPerson.fingers.length === 0) {
      return (
        <View style={styles.noFingerprintsContainer}>
          <Fingerprint size={32} color={colors.textMuted} />
          <Text style={[styles.noFingerprintsText, { color: colors.textSecondary }]}>
            No fingerprint data available
          </Text>
        </View>
      );
    }

    const leftFingers = selectedPerson.fingers.filter(f => f.hand === 'Left');
    const rightFingers = selectedPerson.fingers.filter(f => f.hand === 'Right');

    const renderFingerSection = (fingers, hand) => (
      <View style={styles.fingerSection}>
        <Text style={[styles.fingerSectionTitle, { color: colors.textSecondary }]}>
          {hand} Hand
        </Text>
        <View style={styles.fingerRow}>
          {fingers.map((finger, idx) => {
            const filename = finger.imagePath?.split('\\').pop() || finger.imagePath?.split('/').pop();
            return (
              <View key={idx} style={styles.fingerItem}>
                <FingerprintImage filename={filename} colors={colors} size={55} />
                <Text style={[styles.fingerLabel, { color: colors.textMuted }]} numberOfLines={1}>
                  {finger.finger}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );

    return (
      <View style={styles.fingerprintGridContainer}>
        {leftFingers.length > 0 && renderFingerSection(leftFingers, 'Left')}
        {rightFingers.length > 0 && renderFingerSection(rightFingers, 'Right')}
      </View>
    );
  };

  const dynamicStyles = createStyles(colors);

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
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
          <View style={styles.headerRow}>
            <View>
              <Text style={dynamicStyles.headerTitle}>Recent Activity</Text>
              <Text style={dynamicStyles.headerSubtitle}>
                {recentPersons.length} recently viewed
              </Text>
            </View>
            {recentPersons.length > 0 && (
              <Button
                mode="text"
                compact
                onPress={clearHistory}
                textColor={colors.error}
              >
                Clear All
              </Button>
            )}
          </View>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View style={{ opacity: headerAnim }}>
          <Searchbar
            placeholder="Search recent records..."
            value={search}
            onChangeText={handleSearch}
            style={dynamicStyles.searchBar}
            inputStyle={dynamicStyles.searchInput}
            iconColor={colors.textSecondary}
            placeholderTextColor={colors.textMuted}
          />
        </Animated.View>

        {/* Content */}
        {loading ? (
          <SkeletonLoader colors={colors} />
        ) : (
          <FlatList
            data={filteredPersons}
            keyExtractor={(item, index) => `${item.personId}-${index}`}
            renderItem={renderItem}
            contentContainerStyle={dynamicStyles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        )}

        {/* Detail Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={[
              dynamicStyles.modalContainer,
              { backgroundColor: colors.surface }
            ]}
          >
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Person Details</Text>
              <IconButton
                icon="close"
                size={24}
                iconColor={colors.textSecondary}
                onPress={() => {
                  Haptics.selectionAsync();
                  setModalVisible(false);
                }}
              />
            </View>
            
            <Divider style={{ backgroundColor: colors.border }} />
            
            <ScrollView style={dynamicStyles.modalScrollView} showsVerticalScrollIndicator={false}>
              {selectedPerson && (
                <View style={dynamicStyles.modalContent}>
                  {/* Person Info Header */}
                  <View style={styles.modalPersonHeader}>
                    <View style={[styles.modalAvatar, { backgroundColor: colors.primary + '20' }]}>
                      <User size={36} color={colors.primary} />
                    </View>
                    <View style={styles.modalPersonInfo}>
                      <Text style={[styles.modalPersonName, { color: colors.text }]}>
                        {selectedPerson.name}
                      </Text>
                      <Chip 
                        mode="flat" 
                        compact
                        style={{ 
                          backgroundColor: selectedPerson.gender === 'Male' ? '#3498db20' : '#e91e6320',
                          alignSelf: 'flex-start',
                          marginTop: 4,
                        }}
                        textStyle={{ 
                          color: selectedPerson.gender === 'Male' ? '#3498db' : '#e91e63', 
                          fontSize: 11 
                        }}
                      >
                        {selectedPerson.gender} • {selectedPerson.age} years
                      </Chip>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={styles.modalDetailsSection}>
                    <View style={dynamicStyles.detailRow}>
                      <Text style={dynamicStyles.detailLabel}>Person ID</Text>
                      <Text style={dynamicStyles.detailValue}>{selectedPerson.personId}</Text>
                    </View>
                    <View style={dynamicStyles.detailRow}>
                      <Text style={dynamicStyles.detailLabel}>Address</Text>
                      <Text style={dynamicStyles.detailValue}>{selectedPerson.address}</Text>
                    </View>
                    <View style={dynamicStyles.detailRow}>
                      <Text style={dynamicStyles.detailLabel}>Aadhaar Number</Text>
                      <Text style={dynamicStyles.detailValue}>
                        {selectedPerson.aadhaar ? `XXXX XXXX ${selectedPerson.aadhaar.toString().slice(-4)}` : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* Fingerprints Section */}
                  <View style={styles.fingerprintSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      <Fingerprint size={18} color={colors.primary} /> Fingerprint Records
                    </Text>
                    {renderFingerprintGrid()}
                  </View>
                </View>
              )}
            </ScrollView>

            <Button
              mode="contained"
              onPress={() => {
                Haptics.selectionAsync();
                setModalVisible(false);
              }}
              style={dynamicStyles.modalButton}
              buttonColor={colors.primary}
            >
              Close
            </Button>
          </Modal>
        </Portal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    padding: spacing.md,
  },
  skeletonItem: {
    height: 140,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  skeletonLine: {
    height: 14,
    borderRadius: borderRadius.xs,
  },
  personCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  personInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  personName: {
    ...typography.subtitle1,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  detailText: {
    ...typography.caption,
    flex: 1,
  },
  aadhaarText: {
    ...typography.caption,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  thumbnailContainer: {
    marginLeft: spacing.sm,
  },
  fingerprintContainer: {
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  fingerprintImage: {
    borderRadius: borderRadius.sm,
  },
  fingerprintLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    zIndex: 1,
  },
  fingerprintPlaceholder: {
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h4,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body2,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  // Modal styles
  modalPersonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  modalPersonInfo: {
    flex: 1,
  },
  modalPersonName: {
    ...typography.h4,
    fontWeight: '600',
  },
  modalDetailsSection: {
    marginBottom: spacing.lg,
  },
  fingerprintSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle1,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  fingerprintGridContainer: {
    marginTop: spacing.sm,
  },
  fingerSection: {
    marginBottom: spacing.md,
  },
  fingerSectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fingerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fingerItem: {
    alignItems: 'center',
    width: 60,
  },
  fingerLabel: {
    ...typography.caption,
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
  },
  noFingerprintsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  noFingerprintsText: {
    ...typography.body2,
    marginTop: spacing.sm,
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  searchBar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    elevation: 1,
  },
  searchInput: {
    ...typography.body1,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  modalContainer: {
    margin: spacing.lg,
    borderRadius: borderRadius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.sm,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.text,
  },
  modalScrollView: {
    maxHeight: 450,
  },
  modalContent: {
    padding: spacing.lg,
  },
  detailRow: {
    marginBottom: spacing.md,
  },
  detailLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  detailValue: {
    ...typography.body1,
    color: colors.text,
  },
  modalButton: {
    margin: spacing.lg,
    marginTop: 0,
    borderRadius: borderRadius.md,
  },
});
