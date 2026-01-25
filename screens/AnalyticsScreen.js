import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Surface,
  Button,
  Chip,
  Divider,
  ActivityIndicator,
  SegmentedButtons,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  Star,
  Fingerprint,
  Shield,
  Clock,
  Activity,
  Download,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react-native";
import { useAppTheme } from "../context/ThemeContext";
import { spacing, borderRadius, typography } from "../theme";
import { API_BASE_URL } from "../config/api";

const { width } = Dimensions.get("window");

function StatCard({ title, value, subtitle, icon: Icon, color, colors, delay = 0 }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.statCardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <BlurView intensity={15} tint="dark" style={styles.statCardBlur}>
        <LinearGradient
          colors={colors.gradients?.card || ["rgba(31,41,55,0.8)", "rgba(17,24,39,0.9)"]}
          style={styles.statCard}
        >
          <View style={[styles.statIconContainer, { backgroundColor: color + "20" }]}>
            <Icon size={24} color={color} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.statSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          )}
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

function ProgressBar({ label, value, total, color, colors }) {
  const progress = total > 0 ? (value / total) * 100 : 0;
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={[styles.progressLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.progressValue, { color: colors.textSecondary }]}>
          {value} ({progress.toFixed(1)}%)
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: color,
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

function ActivityItem({ activity, colors }) {
  const getActivityIcon = () => {
    switch (activity.action) {
      case "FINGERPRINT_MATCH":
      case "FINGERPRINT_SCAN":
        return <Fingerprint size={16} color="#22C55E" />;
      case "FACE_MATCH":
      case "FACE_SCAN":
        return <Users size={16} color="#3B82F6" />;
      case "CASE_CREATE":
      case "CASE_UPDATE":
        return <Briefcase size={16} color="#F59E0B" />;
      case "PERSON_CREATE":
      case "PERSON_UPDATE":
        return <Users size={16} color="#8B5CF6" />;
      case "WATCHLIST_ADD":
        return <Star size={16} color="#EF4444" />;
      default:
        return <Activity size={16} color={colors.textMuted} />;
    }
  };

  return (
    <View style={[styles.activityItem, { borderBottomColor: colors.border }]}>
      <View style={[styles.activityIcon, { backgroundColor: colors.surface }]}>
        {getActivityIcon()}
      </View>
      <View style={styles.activityContent}>
        <Text style={[styles.activityAction, { color: colors.text }]}>
          {activity.action?.replace(/_/g, " ")}
        </Text>
        <Text style={[styles.activityDesc, { color: colors.textSecondary }]} numberOfLines={1}>
          {activity.description || activity.targetName || "System action"}
        </Text>
        <Text style={[styles.activityTime, { color: colors.textMuted }]}>
          {new Date(activity.timestamp).toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

export default function AnalyticsScreen({ navigation }) {
  const { colors } = useAppTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [exporting, setExporting] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [analyticsRes, auditRes] = await Promise.all([
        fetch(`${API_BASE_URL}/analytics`),
        fetch(`${API_BASE_URL}/audit-logs?limit=20`),
      ]);

      const analyticsData = await analyticsRes.json();
      const auditData = await auditRes.json();

      setAnalytics(analyticsData);
      setAuditLogs(auditData.logs || []);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleExport = async (type) => {
    setExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Trigger CSV download
      const response = await fetch(`${API_BASE_URL}/export/csv/${type}`);
      if (response.ok) {
        // In a real app, you'd save this to file system or share
        alert(`${type} data exported successfully!`);
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateReport = async (reportType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const response = await fetch(`${API_BASE_URL}/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          title: `${reportType.replace(/_/g, " ")} Report`,
          generatedBy: "current_user",
          parameters: {},
        }),
      });

      if (response.ok) {
        const report = await response.json();
        alert(`Report generated: ${report.reportId}`);
      }
    } catch (err) {
      console.error("Report generation error:", err);
      alert("Failed to generate report");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const overview = analytics?.overview || {};
  const casesByStatus = analytics?.casesByStatus || {};

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.gradients?.background || [colors.background, colors.surface]}
        style={styles.gradient}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <BarChart3 size={28} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
            </View>
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            <SegmentedButtons
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
              buttons={[
                { value: "day", label: "Today" },
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
                { value: "year", label: "Year" },
              ]}
              style={{ backgroundColor: colors.surface }}
            />
          </View>

          {/* Overview Stats */}
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Persons"
              value={overview.totalPersons || 0}
              icon={Users}
              color="#3B82F6"
              colors={colors}
              delay={0}
            />
            <StatCard
              title="Total Cases"
              value={overview.totalCases || 0}
              icon={Briefcase}
              color="#8B5CF6"
              colors={colors}
              delay={100}
            />
            <StatCard
              title="Watchlist"
              value={overview.watchlistCount || 0}
              icon={Star}
              color="#F59E0B"
              colors={colors}
              delay={200}
            />
            <StatCard
              title="Open Cases"
              value={overview.openCases || 0}
              icon={AlertTriangle}
              color="#EF4444"
              colors={colors}
              delay={300}
            />
          </View>

          {/* Case Status Breakdown */}
          <BlurView intensity={15} tint="dark" style={styles.sectionBlur}>
            <LinearGradient
              colors={colors.gradients?.card || ["rgba(31,41,55,0.8)", "rgba(17,24,39,0.9)"]}
              style={styles.section}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Case Status Breakdown</Text>
              
              <ProgressBar
                label="Open"
                value={casesByStatus.open || 0}
                total={overview.totalCases || 1}
                color="#22C55E"
                colors={colors}
              />
              <ProgressBar
                label="In Progress"
                value={casesByStatus.in_progress || 0}
                total={overview.totalCases || 1}
                color="#3B82F6"
                colors={colors}
              />
              <ProgressBar
                label="Pending"
                value={casesByStatus.pending || 0}
                total={overview.totalCases || 1}
                color="#F59E0B"
                colors={colors}
              />
              <ProgressBar
                label="Closed"
                value={casesByStatus.closed || 0}
                total={overview.totalCases || 1}
                color="#6B7280"
                colors={colors}
              />
              <ProgressBar
                label="Archived"
                value={casesByStatus.archived || 0}
                total={overview.totalCases || 1}
                color="#9CA3AF"
                colors={colors}
              />
            </LinearGradient>
          </BlurView>

          {/* Quick Reports */}
          <BlurView intensity={15} tint="dark" style={styles.sectionBlur}>
            <LinearGradient
              colors={colors.gradients?.card || ["rgba(31,41,55,0.8)", "rgba(17,24,39,0.9)"]}
              style={styles.section}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Generate Reports</Text>
              
              <View style={styles.reportButtons}>
                <Button
                  mode="outlined"
                  icon={() => <FileText size={16} color={colors.primary} />}
                  onPress={() => handleGenerateReport("analytics")}
                  style={styles.reportButton}
                  textColor={colors.primary}
                >
                  Analytics
                </Button>
                <Button
                  mode="outlined"
                  icon={() => <Star size={16} color="#F59E0B" />}
                  onPress={() => handleGenerateReport("watchlist_report")}
                  style={styles.reportButton}
                  textColor="#F59E0B"
                >
                  Watchlist
                </Button>
                <Button
                  mode="outlined"
                  icon={() => <Shield size={16} color="#EF4444" />}
                  onPress={() => handleGenerateReport("audit_report")}
                  style={styles.reportButton}
                  textColor="#EF4444"
                >
                  Audit Log
                </Button>
              </View>
            </LinearGradient>
          </BlurView>

          {/* Export Data */}
          <BlurView intensity={15} tint="dark" style={styles.sectionBlur}>
            <LinearGradient
              colors={colors.gradients?.card || ["rgba(31,41,55,0.8)", "rgba(17,24,39,0.9)"]}
              style={styles.section}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Export Data (CSV)</Text>
              
              <View style={styles.exportButtons}>
                <Button
                  mode="contained"
                  icon={() => <Download size={16} color="#FFF" />}
                  onPress={() => handleExport("persons")}
                  loading={exporting}
                  style={[styles.exportButton, { backgroundColor: "#3B82F6" }]}
                >
                  Persons
                </Button>
                <Button
                  mode="contained"
                  icon={() => <Download size={16} color="#FFF" />}
                  onPress={() => handleExport("cases")}
                  loading={exporting}
                  style={[styles.exportButton, { backgroundColor: "#8B5CF6" }]}
                >
                  Cases
                </Button>
                <Button
                  mode="contained"
                  icon={() => <Download size={16} color="#FFF" />}
                  onPress={() => handleExport("watchlist")}
                  loading={exporting}
                  style={[styles.exportButton, { backgroundColor: "#F59E0B" }]}
                >
                  Watchlist
                </Button>
                <Button
                  mode="contained"
                  icon={() => <Download size={16} color="#FFF" />}
                  onPress={() => handleExport("audit")}
                  loading={exporting}
                  style={[styles.exportButton, { backgroundColor: "#EF4444" }]}
                >
                  Audit Logs
                </Button>
              </View>
            </LinearGradient>
          </BlurView>

          {/* Recent Activity */}
          <BlurView intensity={15} tint="dark" style={styles.sectionBlur}>
            <LinearGradient
              colors={colors.gradients?.card || ["rgba(31,41,55,0.8)", "rgba(17,24,39,0.9)"]}
              style={styles.section}
            >
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
                <Chip compact style={{ backgroundColor: colors.primary + "20" }}>
                  <Text style={{ color: colors.primary, fontSize: 10 }}>{auditLogs.length} entries</Text>
                </Chip>
              </View>
              
              {auditLogs.slice(0, 10).map((log, idx) => (
                <ActivityItem key={idx} activity={log} colors={colors} />
              ))}
              
              {auditLogs.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No recent activity
                </Text>
              )}
            </LinearGradient>
          </BlurView>

          {/* Top Officers */}
          {analytics?.topOfficers?.length > 0 && (
            <BlurView intensity={15} tint="dark" style={styles.sectionBlur}>
              <LinearGradient
                colors={colors.gradients?.card || ["rgba(31,41,55,0.8)", "rgba(17,24,39,0.9)"]}
                style={styles.section}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Active Officers</Text>
                
                {analytics.topOfficers.map((officer, idx) => (
                  <View key={idx} style={styles.officerItem}>
                    <View style={styles.officerRank}>
                      <Text style={[styles.rankNumber, { color: colors.primary }]}>#{idx + 1}</Text>
                    </View>
                    <Text style={[styles.officerName, { color: colors.text }]}>{officer._id || "Unknown"}</Text>
                    <Text style={[styles.officerActions, { color: colors.textSecondary }]}>
                      {officer.actions} actions
                    </Text>
                  </View>
                ))}
              </LinearGradient>
            </BlurView>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  periodSelector: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  statCardWrapper: {
    width: (width - spacing.lg * 2 - spacing.sm) / 2,
    margin: spacing.xs,
  },
  statCardBlur: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  statCard: {
    padding: spacing.md,
    alignItems: "center",
    borderRadius: borderRadius.lg,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  statTitle: {
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  sectionBlur: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  section: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: typography.sizes.sm,
  },
  progressValue: {
    fontSize: typography.sizes.sm,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  reportButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  reportButton: {
    flex: 1,
    minWidth: 100,
  },
  exportButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  exportButton: {
    flex: 1,
    minWidth: 80,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  activityDesc: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  activityTime: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: spacing.lg,
  },
  officerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  officerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  rankNumber: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  officerName: {
    flex: 1,
    fontSize: typography.sizes.sm,
  },
  officerActions: {
    fontSize: typography.sizes.xs,
  },
});
