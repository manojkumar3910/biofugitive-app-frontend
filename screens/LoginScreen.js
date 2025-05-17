import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import Toast from "react-native-toast-message";

export default function LoginScreen({ navigation }) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch(
        "https://biofugitive-backend.onrender.com/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: loginId, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: data.message,
          position: "top",
        });
        setTimeout(() => navigation.navigate("Home"), 1500);
      } else {
        Toast.show({
          type: "error",
          text1: data.message,
          position: "top",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Network Error",
        position: "top",
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/Leo D01.jpg")} // Replace with your logo path
          style={styles.logo}
        />
        <Text style={styles.title}>BIO-FUGITIVE</Text>
        <Text style={styles.subtitle}>FINDER</Text>
      </View>

      <Text style={styles.label}>LOGIN ID</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Login ID"
        value={loginId}
        onChangeText={setLoginId}
      />

      <Text style={styles.label}>PASSWORD</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>LOGIN ➜</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: "cover",
    borderRadius: 60, // Optional: if you want circular logo
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    letterSpacing: 1,
  },
  label: {
    fontWeight: "bold",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#d8dcf5",
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#c4c9f5",
    padding: 15,
    alignItems: "center",
    borderRadius: 8,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
});
