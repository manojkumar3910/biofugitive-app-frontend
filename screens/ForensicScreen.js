import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Surface, 
  Button, 
  IconButton,
  ProgressBar,
  Chip,
  Divider,
  SegmentedButtons,
} from "react-native-paper";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "../context/ThemeContext";
import { spacing, borderRadius, shadows, typography } from "../theme";

const { width } = Dimensions.get('window');

// Animated stat card
function StatCard({ title, value, icon, color, delay, colors }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate count
    Animated.timing(countAnim, {
      toValue: value,
      duration: 1500,
      delay,
      useNativeDriver: false,
    }).start();

    countAnim.addListener(({ value }) => {
      setDisplayValue(Math.floor(value));
    });

    return () => countAnim.removeAllListeners();
  }, []);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.surface,
          opacity: scaleAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.statIconBg, { backgroundColor: color + '20' }]}>
        <IconButton icon={icon} size={24} iconColor={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{displayValue}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{title}</Text>
    </Animated.View>
  );
}

// Analysis item component
function AnalysisItem({ title, status, progress, time, colors, index }) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 400,
      delay: 300 + index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const statusColor = {
    completed: colors.success,
    processing: colors.warning,
    pending: colors.textMuted,
  }[status] || colors.textMuted;

  return (
    <Animated.View
      style={{
        opacity: slideAnim,
        transform: [{
          translateX: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        }],
      }}
    >
      <Surface style={[styles.analysisCard, { backgroundColor: colors.surface }]} elevation={1}>
        <View style={styles.analysisHeader}>
          <View style={styles.analysisInfo}>
            <Text style={[styles.analysisTitle, { color: colors.text }]}>{title}</Text>
            <View style={styles.analysisMetaRow}>
              <Chip 
                mode="flat" 
                compact 
                style={{ backgroundColor: statusColor + '20' }}
                textStyle={{ color: statusColor, fontSize: 10 }}
              >
                {status.toUpperCase()}
              </Chip>
              <Text style={[styles.analysisTime, { color: colors.textMuted }]}>{time}</Text>
            </View>
          </View>
          <IconButton 
            icon={status === 'completed' ? 'check-circle' : status === 'processing' ? 'loading' : 'clock-outline'} 
            size={24} 
            iconColor={statusColor} 
          />
        </View>
        {progress !== undefined && (
          <ProgressBar 
            progress={progress} 
            color={statusColor} 
            style={styles.progressBar}
          />
        )}
      </Surface>
    </Animated.View>
  );
}

// Feature card
function FeatureCard({ icon, title, description, onPress, colors, delay }) {
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

  return (
    <Animated.View
      style={{
        opacity: scaleAnim,
        transform: [{ scale: Animated.multiply(scaleAnim, pressScale) }],
        width: (width - spacing.lg * 3) / 2,
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        onPressIn={() => Animated.spring(pressScale, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true }).start()}
      >
        <Surface style={[styles.featureCard, { backgroundColor: colors.surface }]} elevation={2}>
          <View style={[styles.featureIcon, { backgroundColor: colors.surfaceVariant }]}>
            <IconButton icon={icon} size={28} iconColor={colors.primary} />
          </View>
          <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.featureDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {description}
          </Text>
        </Surface>
      </Pressable>
    </Animated.View>
  );
}

export default function ForensicScreen() {
  const { colors } = useAppTheme();
  const [selectedTab, setSelectedTab] = useState('overview');
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const recentAnalyses = [
    { title: 'Fingerprint Match Analysis', status: 'completed', progress: 1, time: '2 min ago' },
    { title: 'DNA Sequence Comparison', status: 'processing', progress: 0.65, time: '5 min ago' },
    { title: 'Facial Recognition Scan', status: 'completed', progress: 1, time: '12 min ago' },
    { title: 'Document Verification', status: 'pending', progress: 0, time: 'Queued' },
  ];

  const features = [
    { icon: 'fingerprint', title: 'Biometrics', description: 'Advanced fingerprint analysis' },
    { icon: 'dna', title: 'DNA Analysis', description: 'Genetic sequence matching' },
    { icon: 'face-recognition', title: 'Face Match', description: 'AI-powered recognition' },
    { icon: 'file-search', title: 'Doc Verify', description: 'Document authenticity' },
  ];

  const dynamicStyles = createStyles(colors);

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <ScrollView 
        style={dynamicStyles.container}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          <Text style={dynamicStyles.headerTitle}>Forensic Lab</Text>
          <Text style={dynamicStyles.headerSubtitle}>
            Advanced Analysis Dashboard
          </Text>
        </Animated.View>

        {/* Stats Overview */}
        <View style={dynamicStyles.statsRow}>
          <StatCard 
            title="Total Cases" 
            value={156} 
            icon="briefcase" 
            color={colors.primary}
            delay={100}
            colors={colors}
          />
          <StatCard 
            title="Matches" 
            value={89} 
            icon="check-decagram" 
            color={colors.success}
            delay={200}
            colors={colors}
          />
          <StatCard 
            title="Pending" 
            value={12} 
            icon="clock-outline" 
            color={colors.warning}
            delay={300}
            colors={colors}
          />
        </View>

        {/* Tab Navigation */}
        <View style={dynamicStyles.tabContainer}>
          <SegmentedButtons
            value={selectedTab}
            onValueChange={setSelectedTab}
            buttons={[
              { value: 'overview', label: 'Overview' },
              { value: 'history', label: 'History' },
              { value: 'reports', label: 'Reports' },
            ]}
            style={dynamicStyles.segmentedButtons}
          />
        </View>

        {/* Quick Actions */}
        <View style={dynamicStyles.sectionHeader}>
          <Text style={dynamicStyles.sectionTitle}>Quick Actions</Text>
          <Button 
            mode="text" 
            compact 
            onPress={() => Haptics.selectionAsync()}
            textColor={colors.primary}
          >
            See All
          </Button>
        </View>
        
        <View style={dynamicStyles.featuresGrid}>
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              colors={colors}
              delay={400 + index * 100}
            />
          ))}
        </View>

        {/* Recent Analyses */}
        <View style={dynamicStyles.sectionHeader}>
          <Text style={dynamicStyles.sectionTitle}>Recent Analyses</Text>
        </View>
        
        <View style={dynamicStyles.analysesList}>
          {recentAnalyses.map((analysis, index) => (
            <AnalysisItem
              key={analysis.title}
              {...analysis}
              colors={colors}
              index={index}
            />
          ))}
        </View>

        {/* Action Button */}
        <Button
          mode="contained"
          icon="plus"
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          style={dynamicStyles.newAnalysisButton}
          buttonColor={colors.primary}
          contentStyle={{ height: 56 }}
        >
          Start New Analysis
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  statIconBg: {
    borderRadius: borderRadius.round,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h3,
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.xxs,
  },
  analysisCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisInfo: {
    flex: 1,
  },
  analysisTitle: {
    ...typography.subtitle2,
    marginBottom: spacing.xs,
  },
  analysisMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  analysisTime: {
    ...typography.caption,
  },
  progressBar: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.xs,
    height: 4,
  },
  featureCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIcon: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  featureTitle: {
    ...typography.subtitle2,
    textAlign: 'center',
  },
  featureDesc: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xxs,
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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
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
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  tabContainer: {
    marginBottom: spacing.lg,
  },
  segmentedButtons: {
    backgroundColor: colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.text,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  analysesList: {
    marginBottom: spacing.lg,
  },
  newAnalysisButton: {
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
});
