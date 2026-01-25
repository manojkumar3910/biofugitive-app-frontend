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
  Image,
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
  Searchbar,
  Switch,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import {
  Users,
  Plus,
  Search,
  Filter,
  ChevronRight,
  User,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  Shield,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Fingerprint,
  Camera,
  FileText,
  Link,
  History,
  Star,
} from "lucide-react-native";
import { useAppTheme } from "../context/ThemeContext";
import { useActivity } from "../context/ActivityContext";
import { spacing, borderRadius, typography } from "../theme";
import { API_BASE_URL } from "../config/api";

const { width } = Dimensions.get("window");

const WATCHLIST_PRIORITY_COLORS = {
  low: "#22C55E",
  medium: "#F59E0B",
  high: "#EF4444",
  critical: "#DC2626",
};

const GENDER_OPTIONS = ["male", "female", "other"];

function PersonCard({ person, onPress, onEdit, onDelete, onWatchlist, colors, index }) {
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

  const genderColor = person.gender === "male" ? "#3B82F6" : person.gender === "female" ? "#EC4899" : "#8B5CF6";

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: scaleAnim }}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(person);
        }}
        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
      >
        <BlurView intensity={15} tint="dark" style={styles.personCardBlur}>
          <LinearGradient
            colors={colors.gradients?.card || ["rgba(31,41,55,0.8)", "rgba(17,24,39,0.9)"]}
            style={styles.personCard}
          >
            <View style={styles.personHeader}>
              <View style={[styles.avatarContainer, { backgroundColor: genderColor + "20" }]}>
                <User size={32} color={genderColor} />
              </View>
              <View style={styles.personInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.personName, { color: colors.text }]} numberOfLines={1}>
                    {person.name}
                  </Text>
                  {person.isOnWatchlist && (
                    <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  )}
                </View>
                <Text style={[styles.personId, { color: colors.primary }]}>
                  {person.personId}
                </Text>
                {person.aliases?.length > 0 && (
                  <Text style={[styles.aliases, { color: colors.textMuted }]} numberOfLines={1}>
                    AKA: {person.aliases.join(", ")}
                  </Text>
                )}
              </View>
              <View style={styles.personActions}>
                <IconButton
                  icon={() => <Star size={18} color={person.isOnWatchlist ? "#F59E0B" : colors.textMuted} />}
                  size={20}
                  onPress={() => onWatchlist(person)}
                />
                <IconButton
                  icon={() => <Edit size={18} color={colors.textMuted} />}
                  size={20}
                  onPress={() => onEdit(person)}
                />
              </View>
            </View>

            <View style={styles.personDetails}>
              <View style={styles.detailItem}>
                <Calendar size={14} color={colors.textMuted} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  Age: {person.age || "N/A"}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <User size={14} color={genderColor} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {person.gender?.charAt(0).toUpperCase() + person.gender?.slice(1) || "N/A"}
                </Text>
              </View>
              {person.phone && (
                <View style={styles.detailItem}>
                  <Phone size={14} color={colors.textMuted} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    {person.phone}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.personChips}>
              {person.isOnWatchlist && (
                <Chip
                  mode="flat"
                  style={[styles.watchlistChip, { backgroundColor: WATCHLIST_PRIORITY_COLORS[person.watchlistPriority] + "20" }]}
                  textStyle={{ color: WATCHLIST_PRIORITY_COLORS[person.watchlistPriority], fontSize: 10 }}
                >
                  WATCHLIST - {person.watchlistPriority?.toUpperCase()}
                </Chip>
              )}
              {person.criminalHistory?.length > 0 && (
                <Chip
                  mode="flat"
                  style={{ backgroundColor: colors.error + "20", height: 24 }}
                  textStyle={{ color: colors.error, fontSize: 10 }}
                >
                  {person.criminalHistory.length} RECORDS
                </Chip>
              )}
              {person.activeAlerts?.length > 0 && (
                <Chip
                  mode="flat"
                  style={{ backgroundColor: "#DC2626" + "20", height: 24 }}
                  textStyle={{ color: "#DC2626", fontSize: 10 }}
                >
                  {person.activeAlerts.length} ALERTS
                </Chip>
              )}
            </View>

            <View style={styles.personFooter}>
              <View style={styles.personStats}>
                <View style={styles.statItem}>
                  <Fingerprint size={14} color={colors.textMuted} />
                  <Text style={[styles.statText, { color: colors.textMuted }]}>
                    {person.fingerprints?.length || 0}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Camera size={14} color={colors.textMuted} />
                  <Text style={[styles.statText, { color: colors.textMuted }]}>
                    {person.photos?.length || 0}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Link size={14} color={colors.textMuted} />
                  <Text style={[styles.statText, { color: colors.textMuted }]}>
                    {person.knownAssociates?.length || 0}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

export default function PersonManagementScreen({ navigation }) {
  const { colors } = useAppTheme();
  const { addActivity } = useActivity();
  
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState(null);
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCriminalModal, setShowCriminalModal] = useState(false);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    gender: "male",
    dateOfBirth: "",
    aadhaar: "",
    phone: "",
    email: "",
    aliases: "",
    height: "",
    weight: "",
    eyeColor: "",
    hairColor: "",
    distinguishingMarks: "",
    notes: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Criminal record form
  const [criminalForm, setCriminalForm] = useState({
    offense: "",
    offenseType: "felony",
    description: "",
    dateArrested: "",
    status: "active",
  });

  // Associate form
  const [associateForm, setAssociateForm] = useState({
    name: "",
    relationship: "criminal",
    description: "",
  });

  const fetchPersons = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (genderFilter) params.append("gender", genderFilter);
      if (watchlistOnly) params.append("watchlist", "true");

      const response = await fetch(`${API_BASE_URL}/persons-db?${params.toString()}`);
      const data = await response.json();
      setPersons(data.persons || []);
    } catch (err) {
      console.error("Error fetching persons:", err);
      Alert.alert("Error", "Failed to load persons");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, genderFilter, watchlistOnly]);

  useEffect(() => {
    fetchPersons();
  }, [fetchPersons]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPersons();
  };

  const handleCreatePerson = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing 
        ? `${API_BASE_URL}/persons-db/${selectedPerson._id}`
        : `${API_BASE_URL}/persons-db`;

      const payload = {
        ...formData,
        aliases: formData.aliases ? formData.aliases.split(",").map(a => a.trim()) : [],
        distinguishingMarks: formData.distinguishingMarks ? formData.distinguishingMarks.split(",").map(m => m.trim()) : [],
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight) : null,
        createdBy: "current_user",
        updatedBy: "current_user",
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addActivity(isEditing ? "PERSON_UPDATED" : "PERSON_CREATED", {
          message: `Person ${isEditing ? "updated" : "created"}: ${formData.name}`,
        });
        setShowCreateModal(false);
        resetForm();
        fetchPersons();
      } else {
        throw new Error("Failed to save person");
      }
    } catch (err) {
      console.error("Error saving person:", err);
      Alert.alert("Error", "Failed to save person");
    }
  };

  const handleToggleWatchlist = async (person) => {
    try {
      const response = await fetch(`${API_BASE_URL}/persons-db/${person._id}/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addedBy: "current_user",
          priority: "medium",
          reason: "Added via app",
        }),
      });

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addActivity(person.isOnWatchlist ? "WATCHLIST_REMOVE" : "WATCHLIST_ADD", {
          message: `${person.name} ${person.isOnWatchlist ? "removed from" : "added to"} watchlist`,
        });
        fetchPersons();
      }
    } catch (err) {
      console.error("Error updating watchlist:", err);
      Alert.alert("Error", "Failed to update watchlist");
    }
  };

  const handleAddCriminalRecord = async () => {
    if (!criminalForm.offense.trim()) {
      Alert.alert("Error", "Offense is required");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/persons-db/${selectedPerson._id}/criminal-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criminalForm),
      });

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowCriminalModal(false);
        setCriminalForm({ offense: "", offenseType: "felony", description: "", dateArrested: "", status: "active" });
        // Refresh person details
        const updated = await response.json();
        setSelectedPerson(updated);
        fetchPersons();
      }
    } catch (err) {
      console.error("Error adding criminal record:", err);
      Alert.alert("Error", "Failed to add criminal record");
    }
  };

  const handleAddAssociate = async () => {
    if (!associateForm.name.trim()) {
      Alert.alert("Error", "Associate name is required");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/persons-db/${selectedPerson._id}/associates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(associateForm),
      });

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowAssociateModal(false);
        setAssociateForm({ name: "", relationship: "criminal", description: "" });
        const updated = await response.json();
        setSelectedPerson(updated);
        fetchPersons();
      }
    } catch (err) {
      console.error("Error adding associate:", err);
      Alert.alert("Error", "Failed to add associate");
    }
  };

  const handleEditPerson = (person) => {
    setSelectedPerson(person);
    setFormData({
      name: person.name || "",
      gender: person.gender || "male",
      dateOfBirth: person.dateOfBirth ? new Date(person.dateOfBirth).toISOString().split("T")[0] : "",
      aadhaar: person.aadhaar || "",
      phone: person.phone || "",
      email: person.email || "",
      aliases: person.aliases?.join(", ") || "",
      height: person.height?.toString() || "",
      weight: person.weight?.toString() || "",
      eyeColor: person.eyeColor || "",
      hairColor: person.hairColor || "",
      distinguishingMarks: person.distinguishingMarks?.join(", ") || "",
      notes: person.notes || "",
    });
    setIsEditing(true);
    setShowCreateModal(true);
  };

  const handleViewPerson = (person) => {
    setSelectedPerson(person);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      gender: "male",
      dateOfBirth: "",
      aadhaar: "",
      phone: "",
      email: "",
      aliases: "",
      height: "",
      weight: "",
      eyeColor: "",
      hairColor: "",
      distinguishingMarks: "",
      notes: "",
    });
    setIsEditing(false);
    setSelectedPerson(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.gradients?.background || [colors.background, colors.surface]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Users size={28} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Person Management</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search persons..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchBar, { backgroundColor: colors.surface }]}
            inputStyle={{ color: colors.text }}
            iconColor={colors.textMuted}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip
              mode={!genderFilter ? "flat" : "outlined"}
              selected={!genderFilter}
              onPress={() => setGenderFilter(null)}
              style={{ marginRight: 8, backgroundColor: !genderFilter ? colors.primary + "30" : "transparent" }}
              textStyle={{ color: !genderFilter ? colors.primary : colors.text }}
            >
              All
            </Chip>
            {GENDER_OPTIONS.map((g) => (
              <Chip
                key={g}
                mode={genderFilter === g ? "flat" : "outlined"}
                selected={genderFilter === g}
                onPress={() => setGenderFilter(genderFilter === g ? null : g)}
                style={{ marginRight: 8, backgroundColor: genderFilter === g ? colors.primary + "30" : "transparent" }}
                textStyle={{ color: genderFilter === g ? colors.primary : colors.text }}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Chip>
            ))}
            <View style={styles.watchlistToggle}>
              <Star size={16} color={watchlistOnly ? "#F59E0B" : colors.textMuted} />
              <Text style={[styles.watchlistText, { color: colors.text }]}>Watchlist</Text>
              <Switch
                value={watchlistOnly}
                onValueChange={setWatchlistOnly}
                color={colors.primary}
              />
            </View>
          </ScrollView>
        </View>

        {/* Persons List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={persons}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => (
              <PersonCard
                person={item}
                onPress={handleViewPerson}
                onEdit={handleEditPerson}
                onDelete={() => {}}
                onWatchlist={handleToggleWatchlist}
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
                <Users size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No persons found</Text>
                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                  Add persons to the database
                </Text>
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
                {isEditing ? "Edit Person" : "Add New Person"}
              </Text>

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Full Name *"
                placeholderTextColor={colors.textMuted}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Gender</Text>
              <View style={styles.chipGroup}>
                {GENDER_OPTIONS.map((g) => (
                  <Chip
                    key={g}
                    mode={formData.gender === g ? "flat" : "outlined"}
                    selected={formData.gender === g}
                    onPress={() => setFormData({ ...formData, gender: g })}
                    style={{ margin: 2, backgroundColor: formData.gender === g ? colors.primary + "30" : "transparent" }}
                    textStyle={{ color: formData.gender === g ? colors.primary : colors.text }}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Chip>
                ))}
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Date of Birth (YYYY-MM-DD)"
                placeholderTextColor={colors.textMuted}
                value={formData.dateOfBirth}
                onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Aadhaar Number"
                placeholderTextColor={colors.textMuted}
                value={formData.aadhaar}
                onChangeText={(text) => setFormData({ ...formData, aadhaar: text })}
                keyboardType="numeric"
              />

              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Phone"
                  placeholderTextColor={colors.textMuted}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={[styles.input, styles.halfInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Email"
                  placeholderTextColor={colors.textMuted}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                />
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Aliases (comma separated)"
                placeholderTextColor={colors.textMuted}
                value={formData.aliases}
                onChangeText={(text) => setFormData({ ...formData, aliases: text })}
              />

              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Height (cm)"
                  placeholderTextColor={colors.textMuted}
                  value={formData.height}
                  onChangeText={(text) => setFormData({ ...formData, height: text })}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.halfInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Weight (kg)"
                  placeholderTextColor={colors.textMuted}
                  value={formData.weight}
                  onChangeText={(text) => setFormData({ ...formData, weight: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Eye Color"
                  placeholderTextColor={colors.textMuted}
                  value={formData.eyeColor}
                  onChangeText={(text) => setFormData({ ...formData, eyeColor: text })}
                />
                <TextInput
                  style={[styles.input, styles.halfInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Hair Color"
                  placeholderTextColor={colors.textMuted}
                  value={formData.hairColor}
                  onChangeText={(text) => setFormData({ ...formData, hairColor: text })}
                />
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Distinguishing Marks (comma separated)"
                placeholderTextColor={colors.textMuted}
                value={formData.distinguishingMarks}
                onChangeText={(text) => setFormData({ ...formData, distinguishingMarks: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Notes"
                placeholderTextColor={colors.textMuted}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
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
                  onPress={handleCreatePerson}
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
            {selectedPerson && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                  <View style={[styles.largeAvatar, { backgroundColor: (selectedPerson.gender === "male" ? "#3B82F6" : "#EC4899") + "20" }]}>
                    <User size={48} color={selectedPerson.gender === "male" ? "#3B82F6" : "#EC4899"} />
                  </View>
                  <Text style={[styles.detailName, { color: colors.text }]}>
                    {selectedPerson.name}
                  </Text>
                  <Text style={[styles.detailId, { color: colors.primary }]}>
                    {selectedPerson.personId}
                  </Text>
                  {selectedPerson.isOnWatchlist && (
                    <Chip
                      mode="flat"
                      style={{ backgroundColor: WATCHLIST_PRIORITY_COLORS[selectedPerson.watchlistPriority] + "20", marginTop: 8 }}
                      textStyle={{ color: WATCHLIST_PRIORITY_COLORS[selectedPerson.watchlistPriority] }}
                    >
                      🔴 WATCHLIST - {selectedPerson.watchlistPriority?.toUpperCase()}
                    </Chip>
                  )}
                </View>

                <Divider style={{ marginVertical: 16, backgroundColor: colors.border }} />

                {/* Basic Info */}
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Gender</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {selectedPerson.gender?.charAt(0).toUpperCase() + selectedPerson.gender?.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Age</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>{selectedPerson.age || "N/A"}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Aadhaar</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>{selectedPerson.aadhaar || "N/A"}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Phone</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>{selectedPerson.phone || "N/A"}</Text>
                    </View>
                  </View>
                </View>

                {/* Criminal History */}
                <View style={styles.detailSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Criminal History ({selectedPerson.criminalHistory?.length || 0})
                    </Text>
                    <Button
                      mode="text"
                      compact
                      onPress={() => setShowCriminalModal(true)}
                      textColor={colors.primary}
                    >
                      + Add
                    </Button>
                  </View>
                  {selectedPerson.criminalHistory?.map((record, idx) => (
                    <View key={idx} style={[styles.recordCard, { backgroundColor: colors.background }]}>
                      <View style={styles.recordHeader}>
                        <AlertTriangle size={16} color={colors.error} />
                        <Text style={[styles.recordOffense, { color: colors.text }]}>{record.offense}</Text>
                      </View>
                      <Text style={[styles.recordType, { color: colors.textSecondary }]}>
                        {record.offenseType} - {record.status}
                      </Text>
                      {record.description && (
                        <Text style={[styles.recordDesc, { color: colors.textMuted }]}>{record.description}</Text>
                      )}
                    </View>
                  ))}
                  {(!selectedPerson.criminalHistory || selectedPerson.criminalHistory.length === 0) && (
                    <Text style={[styles.emptySection, { color: colors.textMuted }]}>No criminal records</Text>
                  )}
                </View>

                {/* Known Associates */}
                <View style={styles.detailSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Known Associates ({selectedPerson.knownAssociates?.length || 0})
                    </Text>
                    <Button
                      mode="text"
                      compact
                      onPress={() => setShowAssociateModal(true)}
                      textColor={colors.primary}
                    >
                      + Add
                    </Button>
                  </View>
                  {selectedPerson.knownAssociates?.map((assoc, idx) => (
                    <View key={idx} style={[styles.associateCard, { backgroundColor: colors.background }]}>
                      <Link size={16} color={colors.primary} />
                      <View style={styles.associateInfo}>
                        <Text style={[styles.associateName, { color: colors.text }]}>{assoc.name}</Text>
                        <Text style={[styles.associateRel, { color: colors.textSecondary }]}>{assoc.relationship}</Text>
                      </View>
                    </View>
                  ))}
                  {(!selectedPerson.knownAssociates || selectedPerson.knownAssociates.length === 0) && (
                    <Text style={[styles.emptySection, { color: colors.textMuted }]}>No known associates</Text>
                  )}
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

        {/* Criminal Record Modal */}
        <Portal>
          <Modal
            visible={showCriminalModal}
            onDismiss={() => setShowCriminalModal(false)}
            contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Criminal Record</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Offense *"
              placeholderTextColor={colors.textMuted}
              value={criminalForm.offense}
              onChangeText={(text) => setCriminalForm({ ...criminalForm, offense: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Description"
              placeholderTextColor={colors.textMuted}
              value={criminalForm.description}
              onChangeText={(text) => setCriminalForm({ ...criminalForm, description: text })}
              multiline
            />

            <View style={styles.modalButtons}>
              <Button mode="outlined" onPress={() => setShowCriminalModal(false)} textColor={colors.textSecondary}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleAddCriminalRecord} style={{ backgroundColor: colors.primary }}>
                Add Record
              </Button>
            </View>
          </Modal>
        </Portal>

        {/* Associate Modal */}
        <Portal>
          <Modal
            visible={showAssociateModal}
            onDismiss={() => setShowAssociateModal(false)}
            contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Known Associate</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Associate Name *"
              placeholderTextColor={colors.textMuted}
              value={associateForm.name}
              onChangeText={(text) => setAssociateForm({ ...associateForm, name: text })}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Description"
              placeholderTextColor={colors.textMuted}
              value={associateForm.description}
              onChangeText={(text) => setAssociateForm({ ...associateForm, description: text })}
            />

            <View style={styles.modalButtons}>
              <Button mode="outlined" onPress={() => setShowAssociateModal(false)} textColor={colors.textSecondary}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleAddAssociate} style={{ backgroundColor: colors.primary }}>
                Add Associate
              </Button>
            </View>
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
  filterRow: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  watchlistToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginLeft: spacing.md,
  },
  watchlistText: {
    fontSize: typography.sizes.sm,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  personCardBlur: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  personCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  personHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  personInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  personName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  personId: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  aliases: {
    fontSize: typography.sizes.xs,
    fontStyle: "italic",
    marginTop: 2,
  },
  personActions: {
    flexDirection: "row",
  },
  personDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingLeft: 68,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: typography.sizes.xs,
  },
  personChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingLeft: 68,
  },
  watchlistChip: {
    height: 24,
  },
  personFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingLeft: 68,
  },
  personStats: {
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
  emptySubtext: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
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
    maxHeight: "85%",
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
  rowInputs: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
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
    alignItems: "center",
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  detailName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  detailId: {
    fontSize: typography.sizes.sm,
  },
  detailSection: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "50%",
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
  },
  infoValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  recordCard: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  recordOffense: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  recordType: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  recordDesc: {
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  associateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  associateInfo: {
    flex: 1,
  },
  associateName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  associateRel: {
    fontSize: typography.sizes.xs,
  },
  emptySection: {
    fontSize: typography.sizes.sm,
    fontStyle: "italic",
  },
});
