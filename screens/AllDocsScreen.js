import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  RefreshControl,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Searchbar, 
  Surface, 
  Chip,
} from "react-native-paper";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  User, 
  Fingerprint,
  ChevronRight,
  Users,
  AlertCircle,
  Search,
  RefreshCw,
} from "lucide-react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../context/ThemeContext";
import { spacing, borderRadius } from "../theme";
import { API_ENDPOINTS } from "../config/api";
import { useActivity } from "../context/ActivityContext";

const { width } = Dimensions.get("window");
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
      {[1, 2, 3, 4, 5].map((item) => (
        <Animated.View
          key={item}
          style={[
            styles.skeletonItem,
            { 
              backgroundColor: colors.surface,
              opacity,
            },
          ]}
        >
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonContent}>
            <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '60%' }]} />
            <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '40%', marginTop: 8 }]} />
            <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '30%', marginTop: 8 }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

// Mask Aadhaar number (show only last 4 digits)
const maskAadhaar = (aadhaar) => {
  if (!aadhaar) return "XXXX XXXX XXXX";
  const parts = aadhaar.split(" ");
  if (parts.length >= 3) {
    return `XXXX XXXX ${parts[2]}`;
  }
  return aadhaar;
};

// Person card component - Clean minimal design
function PersonCard({ item, onPress, index, colors }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 30,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const isMale = item.gender?.toLowerCase() === "male";
  const accentColor = isMale ? "#3B82F6" : "#EC4899";

  return (
    <Animated.View
      style={{
        opacity: scaleAnim,
        transform: [
          { scale: Animated.multiply(scaleAnim, pressScale) },
          {
            translateY: scaleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [15, 0],
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
          {/* Left accent bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
          
          <View style={styles.cardContent}>
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: accentColor + "15" }]}>
              <User size={24} color={accentColor} strokeWidth={1.5} />
            </View>

            {/* Main Info */}
            <View style={styles.cardInfo}>
              <Text style={[styles.personName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {item.gender} • {item.age} yrs
                </Text>
                <View style={styles.separator} />
                <Text style={[styles.idText, { color: colors.textMuted }]}>
                  ID: {item.personId}
                </Text>
              </View>
            </View>

            {/* Right side - prints count */}
            <View style={styles.cardRight}>
              <View style={[styles.printsIndicator, { backgroundColor: colors.success + "15" }]}>
                <Fingerprint size={14} color={colors.success} />
                <Text style={[styles.printsCount, { color: colors.success }]}>
                  {item.fingers?.length || 0}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} style={{ marginTop: 4 }} />
            </View>
          </View>
        </Surface>
      </Pressable>
    </Animated.View>
  );
}

// Filter chip component - Pill style
function FilterChip({ label, selected, onPress, colors, icon }) {
  return (
    <Pressable onPress={onPress}>
      <View style={[
        styles.filterChip,
        { 
          backgroundColor: selected ? colors.primary : "transparent",
          borderColor: selected ? colors.primary : colors.border,
        }
      ]}>
        {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
        <Text style={[
          styles.filterChipText,
          { color: selected ? "#fff" : colors.textSecondary }
        ]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function AllDocsScreen() {
  const { colors } = useAppTheme();
  const { addActivity } = useActivity();
  const navigation = useNavigation();
  const [persons, setPersons] = useState([]);
  const [filteredPersons, setFilteredPersons] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [genderFilter, setGenderFilter] = useState("all");

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    fetchPersons();
  }, []);

  const fetchPersons = async () => {
    setError(null);
    try {
      const response = await axios.get(API_ENDPOINTS.PERSONS);
      const data = response.data.persons || [];
      setPersons(data);
      setFilteredPersons(data);
    } catch (err) {
      console.error("Error fetching persons:", err);
      setError("Failed to load records. Pull to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchPersons();
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    applyFilters(text, genderFilter);
  };

  const handleGenderFilter = (gender) => {
    setGenderFilter(gender);
    applyFilters(search, gender);
  };

  const applyFilters = (searchText, gender) => {
    let filtered = persons;

    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (person) =>
          person.name?.toLowerCase().includes(searchLower) ||
          person.personId?.toString().includes(searchText) ||
          person.address?.toLowerCase().includes(searchLower) ||
          person.aadhaar?.includes(searchText)
      );
    }

    // Gender filter
    if (gender !== "all") {
      filtered = filtered.filter(
        (person) => person.gender?.toLowerCase() === gender.toLowerCase()
      );
    }

    setFilteredPersons(filtered);
    
    // Log search activity only for meaningful searches (3+ chars)
    if (searchText && searchText.length >= 3) {
      addActivity('SEARCH_PERFORMED', { 
        message: `Searched for "${searchText}" - ${filtered.length} results` 
      });
    }
  };

  // Save person to recent viewed list
  const saveToRecent = async (person) => {
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
    } catch (error) {
      console.error('Error saving to recent:', error);
    }
  };

  const openPersonDetail = (person) => {
    // Save to recent when viewing details
    saveToRecent(person);
    // Log activity
    addActivity('DOCUMENT_VIEWED', { message: `Viewed record: ${person.name}` });
    // Navigate to PersonDetail screen
    navigation.navigate('PersonDetail', { person });
  };

  const renderItem = ({ item, index }) => (
    <PersonCard 
      item={item} 
      onPress={openPersonDetail} 
      index={index}
      colors={colors}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Search size={64} color={colors.textMuted} strokeWidth={1} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {search || genderFilter !== "all" ? "No results found" : "No records"}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {search || genderFilter !== "all"
          ? "Try adjusting your search or filters" 
          : "Person records will appear here"}
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <AlertCircle size={64} color={colors.danger} strokeWidth={1} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Something went wrong
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {error}
      </Text>
      <Pressable 
        onPress={fetchPersons}
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
      >
        <RefreshCw size={16} color="#fff" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );

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
          <View style={dynamicStyles.headerTop}>
            <View>
              <Text style={dynamicStyles.headerTitle}>Person Records</Text>
              <Text style={dynamicStyles.headerSubtitle}>
                {filteredPersons.length} of {persons.length} records
              </Text>
            </View>
            <View style={[dynamicStyles.headerBadge, { backgroundColor: colors.primary + "20" }]}>
              <Users size={20} color={colors.primary} />
            </View>
          </View>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View style={{ opacity: headerAnim }}>
          <Searchbar
            placeholder="Search by name, ID, location..."
            value={search}
            onChangeText={handleSearch}
            style={dynamicStyles.searchBar}
            inputStyle={dynamicStyles.searchInput}
            iconColor={colors.textSecondary}
            placeholderTextColor={colors.textMuted}
          />
        </Animated.View>

        {/* Filter Chips */}
        <Animated.View style={[dynamicStyles.filterContainer, { opacity: headerAnim }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={dynamicStyles.filterRow}
          >
            <FilterChip 
              label="All Records" 
              selected={genderFilter === "all"} 
              onPress={() => handleGenderFilter("all")}
              colors={colors}
            />
            <FilterChip 
              label="Male" 
              selected={genderFilter === "male"} 
              onPress={() => handleGenderFilter("male")}
              colors={colors}
            />
            <FilterChip 
              label="Female" 
              selected={genderFilter === "female"} 
              onPress={() => handleGenderFilter("female")}
              colors={colors}
            />
          </ScrollView>
        </Animated.View>

        {/* Content */}
        {loading ? (
          <SkeletonLoader colors={colors} />
        ) : error ? (
          renderErrorState()
        ) : (
          <FlatList
            data={filteredPersons}
            keyExtractor={(item) => item.personId}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    padding: spacing.md,
  },
  skeletonItem: {
    flexDirection: 'row',
    height: 100,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  skeletonContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  skeletonLine: {
    height: 12,
    borderRadius: borderRadius.xs,
  },
  personCard: {
    borderRadius: borderRadius.lg,
    padding: 0,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  personName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
  },
  separator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#999',
    marginHorizontal: 6,
  },
  idText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  cardRight: {
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  printsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  printsCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    elevation: 1,
  },
  searchInput: {
    fontSize: 15,
    color: colors.text,
  },
  filterContainer: {
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
