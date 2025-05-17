import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>BIO FUGITIVE</Text>
      </View>
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.box}
          onPress={() => navigation.navigate("Scan")}
        >
          <Image
            source={require("../assets/scan-icon.png")} // Updated image name
            style={styles.icon}
          />
          <Text style={styles.label}>SCAN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.box}
          onPress={() => navigation.navigate("RecentDocs")}
        >
          <Image
            source={require("../assets/recent-icon.png")}
            style={[styles.icon, { width: 120, height: 120 }]} // Increased size for recent docs icon
          />
          <Text style={styles.label}>RECENT DOCS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.box}
          onPress={() => navigation.navigate("AllDocs")}
        >
          <Image
            source={require("../assets/docs-icon.png")} // Updated image name
            style={styles.icon}
          />
          <Text style={styles.label}>ALL DOCS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.box}
          onPress={() => navigation.navigate("Forensic")}
        >
          <Image
            source={require("../assets/forensic-icon.png")}
            style={[styles.icon, { marginLeft: 40 }]} // Added marginLeft for forensic icon
          />
          <Text style={styles.label}>FORENSIC</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b80ff",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  box: {
    width: 150,
    height: 150,
    margin: 10,
    borderWidth: 1,
    borderColor: "#6b80ff",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#f0f4ff",
  },
  icon: {
    width: 100, // Increased from 80 to 100
    height: 100, // Increased from 80 to 100
    marginBottom: 8,
    resizeMode: "contain",
  },
  label: {
    fontWeight: "bold",
    color: "#000",
  },
});
