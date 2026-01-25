import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Alert,
  Animated,
  Dimensions,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Surface,
  Button,
  IconButton,
  FAB,
  Portal,
  Modal,
  Chip,
  Divider,
  ActivityIndicator,
  Menu,
  Searchbar,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Users,
  FileText,
  Calendar,
  MapPin,
  Tag,
  MessageSquare,
} from "lucide-react-native";
import { useAppTheme } from "../context/ThemeContext";
import { useActivity } from "../context/ActivityContext";
import { spacing, borderRadius, typography } from "../theme";
import { API_BASE_URL } from "../config/api";

const { width } = Dimensions.get("window");

const STATUS_COLORS = {
  open: "#22C55E",
  in_progress: "#3B82F6",
  pending: "#F59E0B",
  closed: "#6B7280",
  archived: "#9CA3AF",
};

const PRIORITY_COLORS = {
  low: "#22C55E",
  medium: "#F59E0B",
  high: "#EF4444",
  critical: "#DC2626",
};

const STATUS_OPTIONS = ["open", "in_progress", "pending", "closed", "archived"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];
const TYPE_OPTIONS = ["criminal", "civil", "investigation", "surveillance", "missing_person", "other"];

function CaseCard({ caseItem, onPress, onEdit, onDelete, colors, index }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const statusColor = STATUS_COLORS[caseItem.status] || colors.textMuted;
  const priorityColor = PRIORITY_COLORS[caseItem.priority] || colors.textMuted;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: scaleAnim }}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(caseItem);
        }}
        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
      >
        <BlurView intensity={15} tint="dark" style={styles.caseCardBlur}>
          <LinearGradient
            colors={colors.gradients?.card || ["rgba(31,41,55,0.8)", "rgba(17,24,39,0.9)"]}
            style={styles.caseCard}
          >
            <View style={styles.caseHeader}>
              <View style={styles.caseInfo}>
                <Text style={[styles.caseNumber, { color: colors.primary }]}>
                  {caseItem.caseNumber}
                </Text>
                <Text style={[styles.caseTitle, { color: colors.text }]} numberOfLines={1}>
                  {caseItem.title}
                </Text>
              </View>
              <View style={styles.caseActions}>
                <IconButton
                  icon={() => <Edit size={18} color={colors.textMuted} />}
                  size={20}
                  onPress={() => onEdit(caseItem)}
                />
                <IconButton
                  icon={() => <Trash2 size={18} color={colors.error} />}
                  size={20}
                  onPress={() => onDelete(caseItem)}
                />
              </View>
            </View>

            <Text style={[styles.caseDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {caseItem.description || "No description provided"}
            </Text>

            <View style={styles.caseChips}>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: statusColor + "20" }]}
                textStyle={{ color: statusColor, fontSize: 11 }}
              >
                {caseItem.status?.replace("_", " ").toUpperCase()}
              </Chip>
              <Chip
                mode="flat"
                style={[styles.priorityChip, { backgroundColor: priorityColor + "20" }]}
                textStyle={{ color: priorityColor, fontSize: 11 }}
              >
                {caseItem.priority?.toUpperCase()}
              </Chip>
              <Chip
                mode="flat"
                style={[styles.typeChip, { backgroundColor: colors.primary + "20" }]}
                textStyle={{ color: colors.primary, fontSize: 11 }}
              >
                {caseItem.type?.replace("_", " ").toUpperCase()}
              </Chip>
            </View>

            <View style={styles.caseFooter}>
              <View style={styles.caseStats}>
                <View style={styles.statItem}>
                  <Users size={14} color={colors.textMuted} />
                  <Text style={[styles.statText, { color: colors.textMuted }]}>
                    {caseItem.suspects?.length || 0} suspects
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MessageSquare size={14} color={colors.textMuted} />
                  <Text style={[styles.statText, { color: colors.textMuted }]}>
                    {caseItem.notes?.length || 0} notes
                  </Text>
                </View>
              </View>
              <View style={styles.dateInfo}>
                <Clock size={12} color={colors.textMuted} />
                <Text style={[styles.dateText, { color: colors.textMuted }]}>
                  {new Date(caseItem.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

export default function CaseManagementScreen({ navigation }) {
  const { colors } = useAppTheme();
  const { addActivity } = useActivity();
  
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseStats, setCaseStats] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "investigation",
    priority: "medium",
    status: "open",
    location: { address: "", city: "", state: "" },
  });
  const [isEditing, setIsEditing] = useState(false);

  const fetchCases = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);

      const response = await fetch(`${API_BASE_URL}/cases?${params.toString()}`);
      const data = await response.json();
      setCases(data.cases || []);
    } catch (err) {
      console.error("Error fetching cases:", err);
      Alert.alert("Error", "Failed to load cases");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter, priorityFilter]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cases-stats`);
      const data = await response.json();
      setCaseStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchCases();
    fetchStats();
  }, [fetchCases]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCases();
    fetchStats();
  };

  const handleCreateCase = async () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Case title is required");
      return;
    }

    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing 
        ? `${API_BASE_URL}/cases/${selectedCase._id}`
        : `${API_BASE_URL}/cases`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          createdBy: "current_user",
          updatedBy: "current_user",
        }),
      });

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addActivity(isEditing ? "CASE_UPDATED" : "CASE_CREATED", {
          message: `Case ${isEditing ? "updated" : "created"}: ${formData.title}`,
        });
        setShowCreateModal(false);
        resetForm();
        fetchCases();
        fetchStats();
      } else {
        throw new Error("Failed to save case");
      }
    } catch (err) {
      console.error("Error saving case:", err);
      Alert.alert("Error", "Failed to save case");
    }
  };

  const handleDeleteCase = (caseItem) => {
    Alert.alert(
      "Delete Case",
      `Are you sure you want to delete case ${caseItem.caseNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/cases/${caseItem._id}?userId=current_user`,
                { method: "DELETE" }
              );
              if (response.ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                addActivity("CASE_DELETED", { message: `Case deleted: ${caseItem.caseNumber}` });
                fetchCases();
                fetchStats();
              }
            } catch (err) {
              console.error("Error deleting case:", err);
              Alert.alert("Error", "Failed to delete case");
            }
          },
        },
      ]
    );
  };

  const handleEditCase = (caseItem) => {
    setSelectedCase(caseItem);
    setFormData({
      title: caseItem.title,
      description: caseItem.description || "",
      type: caseItem.type,
      priority: caseItem.priority,
      status: caseItem.status,
      location: caseItem.location || { address: "", city: "", state: "" },
    });
    setIsEditing(true);
    setShowCreateModal(true);
  };

  const handleViewCase = (caseItem) => {
    setSelectedCase(caseItem);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "investigation",
      priority: "medium",
      status: "open",
      location: { address: "", city: "", state: "" },
    });
    setIsEditing(false);
    setSelectedCase(null);
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { label: "Total", value: caseStats?.total || 0, color: colors.primary },
          { label: "Open", value: caseStats?.byStatus?.open || 0, color: STATUS_COLORS.open },
          { label: "In Progress", value: caseStats?.byStatus?.in_progress || 0, color: STATUS_COLORS.in_progress },
          { label: "Pending", value: caseStats?.byStatus?.pending || 0, color: STATUS_COLORS.pending },
          { label: "Closed", value: caseStats?.byStatus?.closed || 0, color: STATUS_COLORS.closed },
        ].map((stat, idx) => (
          <BlurView key={idx} intensity={15} tint="dark" style={styles.statCard}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
          </BlurView>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.gradients?.background || [colors.background, colors.surface]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Briefcase size={28} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Case Management</Text>
          </View>
          <Menu
            visible={showFilterMenu}
            onDismiss={() => setShowFilterMenu(false)}
            anchor={
              <IconButton
                icon={() => <Filter size={24} color={colors.text} />}
                onPress={() => setShowFilterMenu(true)}
              />
            }
          >
            <Menu.Item title="All Status" onPress={() => { setStatusFilter(null); setShowFilterMenu(false); }} />
            {STATUS_OPTIONS.map((s) => (
              <Menu.Item
                key={s}
                title={s.replace("_", " ").toUpperCase()}
                onPress={() => { setStatusFilter(s); setShowFilterMenu(false); }}
              />
            ))}
          </Menu>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search cases..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchBar, { backgroundColor: colors.surface }]}
            inputStyle={{ color: colors.text }}
            iconColor={colors.textMuted}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Stats */}
        {caseStats && renderStatsCard()}

        {/* Filter Chips */}
        <View style={styles.filterChips}>
          {statusFilter && (
            <Chip
              mode="flat"
              onClose={() => setStatusFilter(null)}
              style={{ backgroundColor: colors.primary + "20" }}
              textStyle={{ color: colors.primary }}
            >
              Status: {statusFilter.replace("_", " ")}
            </Chip>
          )}
          {priorityFilter && (
            <Chip
              mode="flat"
              onClose={() => setPriorityFilter(null)}
              style={{ backgroundColor: colors.primary + "20" }}
              textStyle={{ color: colors.primary }}
            >
              Priority: {priorityFilter}
            </Chip>
          )}
        </View>

        {/* Cases List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={cases}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => (
              <CaseCard
                caseItem={item}
                onPress={handleViewCase}
                onEdit={handleEditCase}
                onDelete={handleDeleteCase}
                colors={colors}
                index={index}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Briefcase size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No cases found</Text>
              </View>
            }
          />
        )}

        {/* FAB */}
        <FAB
          icon={() => <Plus size={24} color="#FFF" />}
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => {
            resetForm();
            setShowCreateModal(true);
          }}
        />

        {/* Create/Edit Modal */}
        <Portal>
          <Modal
            visible={showCreateModal}
            onDismiss={() => { setShowCreateModal(false); resetForm(); }}
            contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isEditing ? "Edit Case" : "Create New Case"}
              </Text>

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Case Title *"
                placeholderTextColor={colors.textMuted}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Description"
                placeholderTextColor={colors.textMuted}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Type</Text>
              <View style={styles.chipGroup}>
                {TYPE_OPTIONS.map((t) => (
                  <Chip
                    key={t}
                    mode={formData.type === t ? "flat" : "outlined"}
                    selected={formData.type === t}
                    onPress={() => setFormData({ ...formData, type: t })}
                    style={{ margin: 2, backgroundColor: formData.type === t ? colors.primary + "30" : "transparent" }}
                    textStyle={{ color: formData.type === t ? colors.primary : colors.text, fontSize: 11 }}
                  >
                    {t.replace("_", " ")}
                  </Chip>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Priority</Text>
              <View style={styles.chipGroup}>
                {PRIORITY_OPTIONS.map((p) => (
                  <Chip
                    key={p}
                    mode={formData.priority === p ? "flat" : "outlined"}
                    selected={formData.priority === p}
                    onPress={() => setFormData({ ...formData, priority: p })}
                    style={{ margin: 2, backgroundColor: formData.priority === p ? PRIORITY_COLORS[p] + "30" : "transparent" }}
                    textStyle={{ color: formData.priority === p ? PRIORITY_COLORS[p] : colors.text }}
                  >
                    {p.toUpperCase()}
                  </Chip>
                ))}
              </View>

              {isEditing && (
                <>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Status</Text>
                  <View style={styles.chipGroup}>
                    {STATUS_OPTIONS.map((s) => (
                      <Chip
                        key={s}
                        mode={formData.status === s ? "flat" : "outlined"}
                        selected={formData.status === s}
                        onPress={() => setFormData({ ...formData, status: s })}
                        style={{ margin: 2, backgroundColor: formData.status === s ? STATUS_COLORS[s] + "30" : "transparent" }}
                        textStyle={{ color: formData.status === s ? STATUS_COLORS[s] : colors.text, fontSize: 11 }}
                      >
                        {s.replace("_", " ")}
                      </Chip>
                    ))}
                  </View>
                </>
              )}

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Location Address"
                placeholderTextColor={colors.textMuted}
                value={formData.location.address}
                onChangeText={(text) => setFormData({ ...formData, location: { ...formData.location, address: text } })}
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => { setShowCreateModal(false); resetForm(); }}
                  style={styles.modalButton}
                  textColor={colors.textSecondary}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleCreateCase}
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                >
                  {isEditing ? "Update" : "Create"}
                </Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>

        {/* Detail Modal */}
        <Portal>
          <Modal
            visible={showDetailModal}
            onDismiss={() => setShowDetailModal(false)}
            contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
          >
            {selectedCase && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                  <Text style={[styles.detailCaseNumber, { color: colors.primary }]}>
                    {selectedCase.caseNumber}
                  </Text>
                  <Chip
                    mode="flat"
                    style={{ backgroundColor: STATUS_COLORS[selectedCase.status] + "20" }}
                    textStyle={{ color: STATUS_COLORS[selectedCase.status] }}
                  >
                    {selectedCase.status?.replace("_", " ").toUpperCase()}
                  </Chip>
                </View>

                <Text style={[styles.detailTitle, { color: colors.text }]}>
                  {selectedCase.title}
                </Text>

                <Text style={[styles.detailDescription, { color: colors.textSecondary }]}>
                  {selectedCase.description || "No description"}
                </Text>

                <Divider style={{ marginVertical: 16, backgroundColor: colors.border }} />

                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
                  <View style={styles.detailRow}>
                    <Tag size={16} color={colors.textMuted} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      Type: {selectedCase.type?.replace("_", " ")}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <AlertTriangle size={16} color={PRIORITY_COLORS[selectedCase.priority]} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      Priority: {selectedCase.priority?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Calendar size={16} color={colors.textMuted} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      Created: {new Date(selectedCase.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Suspects ({selectedCase.suspects?.length || 0})
                  </Text>
                  {selectedCase.suspects?.map((suspect, idx) => (
                    <View key={idx} style={styles.suspectItem}>
                      <User size={16} color={colors.primary} />
                      <Text style={[styles.suspectName, { color: colors.text }]}>{suspect.name}</Text>
                      <Chip compact style={{ backgroundColor: colors.primary + "20" }}>
                        <Text style={{ color: colors.primary, fontSize: 10 }}>{suspect.role}</Text>
                      </Chip>
                    </View>
                  ))}
                  {(!selectedCase.suspects || selectedCase.suspects.length === 0) && (
                    <Text style={[styles.emptySection, { color: colors.textMuted }]}>No suspects added</Text>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Timeline ({selectedCase.timeline?.length || 0})
                  </Text>
                  {selectedCase.timeline?.slice(0, 5).map((entry, idx) => (
                    <View key={idx} style={styles.timelineItem}>
                      <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                      <View style={styles.timelineContent}>
                        <Text style={[styles.timelineAction, { color: colors.text }]}>{entry.action}</Text>
                        <Text style={[styles.timelineDescription, { color: colors.textSecondary }]}>
                          {entry.description}
                        </Text>
                        <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                <Button
                  mode="contained"
                  onPress={() => setShowDetailModal(false)}
                  style={{ marginTop: 16, backgroundColor: colors.primary }}
                >
                  Close
                </Button>
              </ScrollView>
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  searchBar: {
    borderRadius: borderRadius.lg,
    elevation: 0,
  },
  statsContainer: {
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
  },
  statCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    alignItems: "center",
    minWidth: 80,
    overflow: "hidden",
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  filterChips: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  caseCardBlur: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  caseCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  caseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  caseInfo: {
    flex: 1,
  },
  caseNumber: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  caseTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
  caseActions: {
    flexDirection: "row",
  },
  caseDescription: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  caseChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  statusChip: {
    height: 26,
  },
  priorityChip: {
    height: 26,
  },
  typeChip: {
    height: 26,
  },
  caseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  caseStats: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: typography.sizes.xs,
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: typography.sizes.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl,
  },
  modal: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.sizes.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  chipGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalButton: {
    minWidth: 100,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  detailCaseNumber: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  detailTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  detailDescription: {
    fontSize: typography.sizes.md,
    lineHeight: 22,
  },
  detailSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  detailText: {
    fontSize: typography.sizes.sm,
  },
  suspectItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  suspectName: {
    flex: 1,
    fontSize: typography.sizes.sm,
  },
  emptySection: {
    fontSize: typography.sizes.sm,
    fontStyle: "italic",
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  timelineContent: {
    flex: 1,
  },
  timelineAction: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  timelineDescription: {
    fontSize: typography.sizes.xs,
  },
  timelineDate: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
