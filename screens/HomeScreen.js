import React, { useRef, useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  Pressable,
  ScrollView,
  Dimensions,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Surface, IconButton, Avatar, Badge, Menu, Icon } from "react-native-paper";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { 
  ScanLine, 
  Clock, 
  FileText, 
  Microscope,
  Fingerprint,
  Activity,
} from "lucide-react-native";
import { useAppTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useActivity, formatTimeAgo } from "../context/ActivityContext";
import { spacing, borderRadius, shadows, typography } from "../theme";
import { API_ENDPOINTS } from "../config/api";

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 3) / 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function MenuCard({ title, Icon, onPress, delay, colors, iconColor }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        {
          opacity: opacityAnim,
          transform: [{ scale: Animated.multiply(scaleAnim, pressScale) }],
        },
      ]}
    >
      <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={2}>
        <View style={[styles.iconContainer, { backgroundColor: (iconColor || colors.primary) + '15' }]}>
          <Icon size={36} color={iconColor || colors.primary} strokeWidth={1.8} />
        </View>
        <Text style={[styles.cardLabel, { color: colors.text }]}>{title}</Text>
      </Surface>
    </AnimatedPressable>
  );
}

export default function HomeScreen({ navigation }) {
  const { colors, toggleTheme, isDark } = useAppTheme();
  const { user, logout } = useAuth();
  const { activities, refreshActivities, addActivity } = useActivity();
  const headerAnim = useRef(new Animated.Value(0)).current;
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalFingerprints: 0,
    maleCount: 0,
    femaleCount: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.STATS);
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    fetchStats();
  }, [fetchStats]);

  // Refresh activities and stats when screen focuses
  useFocusEffect(
    useCallback(() => {
      refreshActivities();
      fetchStats();
    }, [refreshActivities, fetchStats])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refreshActivities();
    fetchStats();
    setTimeout(() => setRefreshing(false), 500);
  }, [refreshActivities, fetchStats]);

  // Get color for activity type
  const getActivityColor = (colorType) => {
    switch (colorType) {
      case 'success': return colors.success;
      case 'danger': return colors.danger || colors.error;
      case 'warning': return colors.warning;
      case 'info': return colors.info || colors.secondary;
      case 'primary': 
      default: return colors.primary;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await logout();
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      title: "SCAN",
      Icon: Fingerprint,
      route: "Scan",
      iconColor: colors.primary,
    },
    {
      title: "RECENT",
      Icon: Clock,
      route: "RecentDocs",
      iconColor: colors.accent || '#8B5CF6',
    },
    {
      title: "DOCUMENTS",
      Icon: FileText,
      route: "Documents",
      iconColor: colors.success,
    },
    {
      title: "FORENSIC",
      Icon: Microscope,
      route: "Forensic",
      iconColor: colors.warning,
    },
  ];

  const dynamicStyles = createStyles(colors);

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <ScrollView 
        style={dynamicStyles.container}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
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
          <View style={dynamicStyles.headerLeft}>
            <Avatar.Image 
              size={50} 
              source={require("../assets/Leo D01.jpg")}
              style={dynamicStyles.avatar}
            />
            <View style={dynamicStyles.headerTextContainer}>
              <Text style={dynamicStyles.welcomeText}>Welcome back</Text>
              <Text style={dynamicStyles.userName}>{user?.name || 'Officer'}</Text>
            </View>
          </View>
          <View style={dynamicStyles.headerRight}>
            <IconButton 
              icon={isDark ? "weather-sunny" : "weather-night"}
              size={24}
              iconColor={colors.textSecondary}
              onPress={() => {
                Haptics.selectionAsync();
                toggleTheme();
              }}
            />
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton 
                  icon="dots-vertical" 
                  size={24}
                  iconColor={colors.textSecondary}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMenuVisible(true);
                  }}
                />
              }
              contentStyle={{ backgroundColor: colors.surface }}
            >
              <Menu.Item 
                onPress={() => {
                  setMenuVisible(false);
                  handleLogout();
                }} 
                title="Logout"
                titleStyle={{ color: colors.danger || colors.error || '#EF4444' }}
                leadingIcon={({ size }) => (
                  <Icon source="logout" size={size} color={colors.danger || colors.error || '#EF4444'} />
                )}
              />
            </Menu>
          </View>
        </Animated.View>

        {/* Title Section */}
        <Animated.View 
          style={[
            dynamicStyles.titleSection,
            { opacity: headerAnim },
          ]}
        >
          <Text style={dynamicStyles.titleText}>BIO-FUGITIVE</Text>
          <Text style={dynamicStyles.subtitleText}>FINDER</Text>
          <View style={dynamicStyles.divider} />
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View 
          style={[
            dynamicStyles.statsContainer,
            { opacity: headerAnim },
          ]}
        >
          <Surface style={[dynamicStyles.statCard, { backgroundColor: colors.surface }]} elevation={1}>
            <Text style={[dynamicStyles.statNumber, { color: colors.primary }]}>{stats.totalRecords}</Text>
            <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>Total Records</Text>
          </Surface>
          <Surface style={[dynamicStyles.statCard, { backgroundColor: colors.surface }]} elevation={1}>
            <Text style={[dynamicStyles.statNumber, { color: colors.success }]}>{stats.maleCount}</Text>
            <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>Male</Text>
          </Surface>
          <Surface style={[dynamicStyles.statCard, { backgroundColor: colors.surface }]} elevation={1}>
            <Text style={[dynamicStyles.statNumber, { color: colors.warning }]}>{stats.femaleCount}</Text>
            <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>Female</Text>
          </Surface>
        </Animated.View>

        {/* Menu Grid */}
        <View style={dynamicStyles.gridContainer}>
          <Text style={dynamicStyles.sectionTitle}>Quick Actions</Text>
          <View style={dynamicStyles.grid}>
            {menuItems.map((item, index) => (
              <MenuCard
                key={item.route}
                title={item.title}
                Icon={item.Icon}
                iconColor={item.iconColor}
                onPress={() => navigation.navigate(item.route)}
                delay={100 + index * 100}
                colors={colors}
              />
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={dynamicStyles.recentSection}>
          <View style={dynamicStyles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>Recent Activity</Text>
            <Activity size={18} color={colors.textMuted} />
          </View>
          <Surface style={[dynamicStyles.activityCard, { backgroundColor: colors.surface }]} elevation={1}>
            {activities.length === 0 ? (
              <View style={dynamicStyles.emptyActivity}>
                <Clock size={32} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={[dynamicStyles.emptyActivityText, { color: colors.textSecondary }]}>
                  No recent activity
                </Text>
                <Text style={[dynamicStyles.emptyActivityHint, { color: colors.textMuted }]}>
                  Start scanning to see your activity here
                </Text>
              </View>
            ) : (
              activities.slice(0, 5).map((activity, index) => (
                <React.Fragment key={activity.id}>
                  {index > 0 && <View style={dynamicStyles.activityDivider} />}
                  <View style={dynamicStyles.activityItem}>
                    <View style={[dynamicStyles.activityDot, { backgroundColor: getActivityColor(activity.color) }]} />
                    <View style={dynamicStyles.activityContent}>
                      <Text style={[dynamicStyles.activityText, { color: colors.text }]} numberOfLines={1}>
                        {activity.message}
                      </Text>
                      <Text style={[dynamicStyles.activityTime, { color: colors.textMuted }]}>
                        {formatTimeAgo(activity.timestamp)}
                      </Text>
                    </View>
                  </View>
                </React.Fragment>
              ))
            )}
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardLabel: {
    ...typography.label,
    letterSpacing: 1.5,
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    ...shadows.sm,
  },
  headerTextContainer: {
    marginLeft: spacing.md,
  },
  welcomeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  userName: {
    ...typography.subtitle1,
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.error,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  titleText: {
    ...typography.h2,
    color: colors.primary,
  },
  subtitleText: {
    ...typography.subtitle2,
    color: colors.textSecondary,
    letterSpacing: 6,
    marginTop: spacing.xs,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    marginTop: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statNumber: {
    ...typography.h3,
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.xxs,
  },
  gridContainer: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recentSection: {
    marginTop: spacing.lg,
  },
  activityCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    ...typography.body2,
  },
  activityTime: {
    ...typography.caption,
    marginTop: spacing.xxs,
  },
  activityDivider: {
    height: 1,
    backgroundColor: colors.borderLight || colors.border,
    marginLeft: spacing.lg + 8,
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyActivityText: {
    ...typography.body1,
    marginTop: spacing.md,
  },
  emptyActivityHint: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
