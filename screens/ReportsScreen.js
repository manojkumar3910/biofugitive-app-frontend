import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Surface,
  Button,
  Chip,
  Divider,
  ActivityIndicator,
  Modal,
  Portal,
  TextInput,
  RadioButton,
  IconButton,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  FileText,
  Plus,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Share2,
  BarChart3,
  Users,
  Star,
  Shield,
  Briefcase,
  Eye,
} from "lucide-react-native";
import { useAppTheme } from "../context/ThemeContext";
import { spacing, borderRadius, typography } from "../theme";
import { API_BASE_URL } from "../config/api";

const { width } = Dimensions.get("window");

const REPORT_TYPES = [
  { value: "analytics", label: "Analytics", icon: BarChart3, color: "#3B82F6" },
  { value: "case_summary", label: "Case Summary", icon: Briefcase, color: "#8B5CF6" },
  { value: "person_list", label: "Person List", icon: Users, color: "#22C55E" },
  { value: "watchlist_report", label: "Watchlist", icon: Star, color: "#F59E0B" },
  { value: "activity_report", label: "Activity Log", icon: Clock, color: "#06B6D4" },
  { value: "audit_report", label: "Audit Report", icon: Shield, color: "#EF4444" },
];

const REPORT_FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
  { value: "excel", label: "Excel" },
  { value: "json", label: "JSON" },
];

function ReportCard({ report, colors, onView, onDelete }) {
  const getStatusIcon = () => {
    switch (report.status) {
      case "completed":
        return <CheckCircle size={16} color="#22C55E" />;
      case "failed":
        return <XCircle size={16} color="#EF4444" />;
      case "generating":
        return <RefreshCw size={16} color="#F59E0B" />;
      default:
        return <Clock size={16} color={colors.textMuted} />;
    }
  };

  const getStatusColor = () => {
    switch (report.status) {
      case "completed": return "#22C55E";
      case "failed": return "#EF4444";
      case "generating": return "#F59E0B";
      default: return colors.textMuted;
    }
  };

  const reportType = REPORT_TYPES.find(t => t.value === report.type);
  const TypeIcon = reportType?.icon || FileText;

  return (
    <BlurView intensity={15} tint="dark" style={styles.reportCardBlur}>
      <LinearGradient
        colors={colors.gradients?.card || ["rgba(31,41,55,0.8)", "rgba(17,24,39,0.9)"]}
        style={styles.reportCard}
      >
        <View style={styles.reportCardHeader}>
          <View style={[styles.reportTypeIcon, { backgroundColor: (reportType?.color || colors.primary) + "20" }]}>
            <TypeIcon size={20} color={reportType?.color || colors.primary} />
          </View>
          <View style={styles.reportInfo}>
            <Text style={[styles.reportTitle, { color: colors.text }]} numberOfLines={1}>
              {report.title || "Untitled Report"}
            </Text>
            <Text style={[styles.reportId, { color: colors.textMuted }]}>
              {report.reportId}
            </Text>
          </View>
          <View style={styles.reportActions}>
            <IconButton
              icon={() => <Eye size={18} color={colors.textSecondary} />}
              size={20}
              onPress={() => onView(report)}
            />
            <IconButton
              icon={() => <Trash2 size={18} color="#EF4444" />}
              size={20}
              onPress={() => onDelete(report)}
            />
          </View>
        </View>

        <Divider style={{ backgroundColor: colors.border, marginVertical: spacing.sm }} />

        <View style={styles.reportMeta}>
          <Chip
            compact
            icon={() => getStatusIcon()}
            style={{ backgroundColor: getStatusColor() + "20" }}
          >
            <Text style={{ color: getStatusColor(), fontSize: 10 }}>
              {report.status?.toUpperCase()}
            </Text>
          </Chip>
          <Chip compact style={{ backgroundColor: colors.surface }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10 }}>
              {report.format?.toUpperCase() || "PDF"}
            </Text>
          </Chip>
          <Text style={[styles.reportDate, { color: colors.textMuted }]}>
            {new Date(report.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {report.description && (
          <Text style={[styles.reportDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {report.description}
          </Text>
        )}
      </LinearGradient>
    </BlurView>
  );
}

export default function ReportsScreen({ navigation }) {
  const { colors } = useAppTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  
  // Create Report Modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newReport, setNewReport] = useState({
    type: "analytics",
    title: "",
    description: "",
    format: "pdf",
  });

  // View Report Modal
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports`);
      const data = await response.json();
      // Handle both array and { reports } object response
      setReports(Array.isArray(data) ? data : (data.reports || []));
    } catch (err) {
      console.error("Error fetching reports:", err);
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const handleCreateReport = async () => {
    if (!newReport.title.trim()) {
      Alert.alert("Error", "Please enter a report title");
      return;
    }

    setGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await fetch(`${API_BASE_URL}/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newReport.type,
          title: newReport.title,
          description: newReport.description,
          format: newReport.format,
          generatedBy: "current_user",
          parameters: {},
        }),
      });

      if (response.ok) {
        const report = await response.json();
        setReports(prev => [report, ...prev]);
        setCreateModalVisible(false);
        setNewReport({ type: "analytics", title: "", description: "", format: "pdf" });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", "Failed to generate report");
      }
    } catch (err) {
      console.error("Error generating report:", err);
      Alert.alert("Error", "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = (report) => {
    Alert.alert(
      "Delete Report",
      `Are you sure you want to delete "${report.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${API_BASE_URL}/reports/${report._id}`, {
                method: "DELETE",
              });
              setReports(prev => prev.filter(r => r._id !== report._id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err) {
              console.error("Error deleting report:", err);
            }
          },
        },
      ]
    );
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setViewModalVisible(true);
  };

  const handleShareReport = async () => {
    if (!selectedReport) return;
    
    try {
      await Share.share({
        message: `Report: ${selectedReport.title}\nID: ${selectedReport.reportId}\nGenerated: ${new Date(selectedReport.createdAt).toLocaleString()}`,
        title: selectedReport.title,
      });
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleQuickExport = async (type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const response = await fetch(`${API_BASE_URL}/export/csv/${type}`);
      if (response.ok) {
        Alert.alert("Success", `${type} data exported successfully!`);
      }
    } catch (err) {
      console.error("Export error:", err);
      Alert.alert("Error", "Export failed");
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
              <FileText size={28} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Reports</Text>
            </View>
            <Button
              mode="contained"
              icon={() => <Plus size={18} color="#FFF" />}
              onPress={() => setCreateModalVisible(true)}
              buttonColor={colors.primary}
            >
              New
            </Button>
          </View>

          {/* Quick Export Section */}
          <BlurView intensity={15} tint="dark" style={styles.quickExportBlur}>
            <LinearGradient
              colors={colors.gradients?.card || ["rgba(31,41,55,0.8)", "rgba(17,24,39,0.9)"]}
              style={styles.quickExportSection}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Export (CSV)</Text>
              <View style={styles.quickExportButtons}>
                <TouchableOpacity
                  style={[styles.quickExportBtn, { backgroundColor: "#3B82F620" }]}
                  onPress={() => handleQuickExport("persons")}
                >
                  <Users size={20} color="#3B82F6" />
                  <Text style={[styles.quickExportLabel, { color: "#3B82F6" }]}>Persons</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickExportBtn, { backgroundColor: "#8B5CF620" }]}
                  onPress={() => handleQuickExport("cases")}
                >
                  <Briefcase size={20} color="#8B5CF6" />
                  <Text style={[styles.quickExportLabel, { color: "#8B5CF6" }]}>Cases</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickExportBtn, { backgroundColor: "#F59E0B20" }]}
                  onPress={() => handleQuickExport("watchlist")}
                >
                  <Star size={20} color="#F59E0B" />
                  <Text style={[styles.quickExportLabel, { color: "#F59E0B" }]}>Watchlist</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickExportBtn, { backgroundColor: "#EF444420" }]}
                  onPress={() => handleQuickExport("audit")}
                >
                  <Shield size={20} color="#EF4444" />
                  <Text style={[styles.quickExportLabel, { color: "#EF4444" }]}>Audit</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>

          {/* Generated Reports */}
          <View style={styles.reportsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: spacing.lg }]}>
              Generated Reports ({reports.length})
            </Text>
            
            {reports.length === 0 ? (
              <BlurView intensity={15} tint="dark" style={styles.emptyBlur}>
                <LinearGradient
                  colors={colors.gradients?.card || ["rgba(31,41,55,0.8)", "rgba(17,24,39,0.9)"]}
                  style={styles.emptyContainer}
                >
                  <FileText size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Reports Yet</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    Create your first report to get started
                  </Text>
                  <Button
                    mode="contained"
                    icon={() => <Plus size={18} color="#FFF" />}
                    onPress={() => setCreateModalVisible(true)}
                    style={{ marginTop: spacing.md }}
                    buttonColor={colors.primary}
                  >
                    Create Report
                  </Button>
                </LinearGradient>
              </BlurView>
            ) : (
              reports.map((report) => (
                <ReportCard
                  key={report._id}
                  report={report}
                  colors={colors}
                  onView={handleViewReport}
                  onDelete={handleDeleteReport}
                />
              ))
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Create Report Modal */}
        <Portal>
          <Modal
            visible={createModalVisible}
            onDismiss={() => setCreateModalVisible(false)}
            contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Generate New Report</Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Report Type</Text>
            <View style={styles.typeGrid}>
              {REPORT_TYPES.map((type) => {
                const TypeIcon = type.icon;
                const isSelected = newReport.type === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      { 
                        backgroundColor: isSelected ? type.color + "30" : colors.background,
                        borderColor: isSelected ? type.color : colors.border,
                      },
                    ]}
                    onPress={() => setNewReport(prev => ({ ...prev, type: type.value }))}
                  >
                    <TypeIcon size={18} color={isSelected ? type.color : colors.textMuted} />
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: isSelected ? type.color : colors.textSecondary },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              label="Report Title"
              value={newReport.title}
              onChangeText={(text) => setNewReport(prev => ({ ...prev, title: text }))}
              style={styles.input}
              mode="outlined"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
            />

            <TextInput
              label="Description (Optional)"
              value={newReport.description}
              onChangeText={(text) => setNewReport(prev => ({ ...prev, description: text }))}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Format</Text>
            <RadioButton.Group
              value={newReport.format}
              onValueChange={(value) => setNewReport(prev => ({ ...prev, format: value }))}
            >
              <View style={styles.formatRow}>
                {REPORT_FORMATS.map((format) => (
                  <View key={format.value} style={styles.formatOption}>
                    <RadioButton value={format.value} color={colors.primary} />
                    <Text style={{ color: colors.text }}>{format.label}</Text>
                  </View>
                ))}
              </View>
            </RadioButton.Group>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setCreateModalVisible(false)}
                style={styles.modalButton}
                textColor={colors.textSecondary}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateReport}
                loading={generating}
                disabled={generating || !newReport.title.trim()}
                style={styles.modalButton}
                buttonColor={colors.primary}
              >
                Generate
              </Button>
            </View>
          </Modal>
        </Portal>

        {/* View Report Modal */}
        <Portal>
          <Modal
            visible={viewModalVisible}
            onDismiss={() => setViewModalVisible(false)}
            contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
          >
            {selectedReport && (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedReport.title}</Text>
                
                <View style={styles.reportDetailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Report ID:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedReport.reportId}</Text>
                </View>
                <View style={styles.reportDetailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Type:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedReport.type?.replace(/_/g, " ")}
                  </Text>
                </View>
                <View style={styles.reportDetailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Status:</Text>
                  <Chip compact style={{ backgroundColor: "#22C55E20" }}>
                    <Text style={{ color: "#22C55E", fontSize: 10 }}>
                      {selectedReport.status?.toUpperCase()}
                    </Text>
                  </Chip>
                </View>
                <View style={styles.reportDetailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Format:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedReport.format?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.reportDetailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Created:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </Text>
                </View>
                
                {selectedReport.description && (
                  <View style={styles.reportDescription}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Description:</Text>
                    <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                      {selectedReport.description}
                    </Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    icon={() => <Share2 size={16} color={colors.primary} />}
                    onPress={handleShareReport}
                    style={styles.modalButton}
                    textColor={colors.primary}
                  >
                    Share
                  </Button>
                  <Button
                    mode="contained"
                    icon={() => <Download size={16} color="#FFF" />}
                    onPress={() => setViewModalVisible(false)}
                    style={styles.modalButton}
                    buttonColor={colors.primary}
                  >
                    Download
                  </Button>
                </View>
              </>
            )}
          </Modal>
        </Portal>
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
  quickExportBlur: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  quickExportSection: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  quickExportButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  quickExportBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  quickExportLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  reportsSection: {
    marginTop: spacing.lg,
  },
  reportCardBlur: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  reportCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  reportCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  reportTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  reportId: {
    fontSize: typography.sizes.xs,
  },
  reportActions: {
    flexDirection: "row",
  },
  reportMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  reportDate: {
    fontSize: typography.sizes.xs,
    marginLeft: "auto",
  },
  reportDesc: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
  },
  emptyBlur: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
    borderRadius: borderRadius.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  modal: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  typeLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  input: {
    marginTop: spacing.sm,
  },
  formatRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  formatOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalButton: {
    minWidth: 100,
  },
  reportDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.sizes.sm,
  },
  detailValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  reportDescription: {
    marginTop: spacing.sm,
  },
  descriptionText: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
});
