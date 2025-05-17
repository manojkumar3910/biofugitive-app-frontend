import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import axios from "axios";

export default function AllDocsScreen() {
  const [docs, setDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      // Replace with your real API endpoint URL
      const response = await axios.get("https://biofugitive-backend.onrender.com/documents");
      setDocs(response.data);
      setFilteredDocs(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleSearch = (text) => {
    setSearch(text);
    const filtered = docs.filter(
      (doc) =>
        doc.Name.toLowerCase().includes(text.toLowerCase()) ||
        doc["Person ID"].toString().includes(text)
    );
    setFilteredDocs(filtered);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        setSelectedDoc(item);
        setModalVisible(true);
      }}
    >
      <Text style={styles.itemText}>ID: {item["Person ID"]}</Text>
      <Text style={styles.itemText}>Name: {item.Name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>All Documents</Text>

      <TextInput
        style={styles.searchBar}
        placeholder="Search by ID or Name"
        value={search}
        onChangeText={handleSearch}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007bff"
          style={{ marginTop: 20 }}
        />
      ) : filteredDocs.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
          No documents found.
        </Text>
      ) : (
        <FlatList
          data={filteredDocs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Modal for full details */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.detailTitle}>User Details</Text>
          {selectedDoc &&
            Object.entries(selectedDoc).map(([key, value]) => (
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
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    paddingTop: 40, // Add top padding to avoid status bar
    backgroundColor: "#fff" 
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,    // Add top margin
    marginBottom: 20, // Increase bottom margin
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
  modalContainer: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
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
    marginTop: 30,
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
