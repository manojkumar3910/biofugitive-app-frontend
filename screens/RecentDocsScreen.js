import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";

export default function RecentDocsScreen() {
  const route = useRoute();
  // We'll store recent users here; for demo, only 1 user is passed from AllDocsScreen
  const [recentUsers, setRecentUsers] = useState(
    route.params?.selectedUser ? [route.params.selectedUser] : []
  );
  const [filteredUsers, setFilteredUsers] = useState(recentUsers);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Filter on search
  const handleSearch = (text) => {
    setSearch(text);
    const filtered = recentUsers.filter(
      (user) =>
        user.Name.toLowerCase().includes(text.toLowerCase()) ||
        user["Person ID"].toString().includes(text)
    );
    setFilteredUsers(filtered);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        setSelectedUser(item);
        setModalVisible(true);
      }}
    >
      <Text style={styles.itemText}>ID: {item["Person ID"]}</Text>
      <Text style={styles.itemText}>Name: {item.Name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recent Documents</Text>

      <TextInput
        style={styles.searchBar}
        placeholder="Search recent docs by ID or Name"
        value={search}
        onChangeText={handleSearch}
      />

      {filteredUsers.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
          No recent documents found.
        </Text>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Modal for full details */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <Text style={styles.detailTitle}>User Details</Text>
            {selectedUser &&
              Object.entries(selectedUser).map(([key, value]) => (
                <View key={key} style={styles.detailItem}>
                  <Text style={styles.detailKey}>{key}</Text>
                  <Text style={styles.detailValue}>{value}</Text>
                </View>
              ))}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  item: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  itemText: { fontSize: 16 },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxHeight: "80%",
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  detailItem: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 8,
  },
  detailKey: { fontWeight: "600", color: "#555", marginBottom: 4 },
  detailValue: { color: "#333", fontSize: 16 },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
