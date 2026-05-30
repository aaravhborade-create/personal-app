import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Modal,
  Image,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";

export default function Profile({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profileimage, setProfileImage] = useState(null);

  // modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  // stats state
  const [weeklyMeals, setWeeklyMeals] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [totalRecipes, setTotalRecipes] = useState(0);

  useEffect(() => {
    getUserData();
    fetchTotalRecipes();
  }, []);

  // reload stats every time the screen is focused so numbers stay fresh
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const getUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData !== null) {
        const user = JSON.parse(userData);
        setUsername(user.name);
        setEmail(user.email);
      }
      const savedImage = await AsyncStorage.getItem("profileImage");
      if (savedImage) setProfileImage(savedImage);
    } catch (error) {
      console.log("Error getting user data:", error);
    }
  };

  // fetch total recipe count from MealDB a-z (same as MealPlanner)
  // caches result in AsyncStorage so it only hits the API once
  const fetchTotalRecipes = async () => {
    try {
      const cached = await AsyncStorage.getItem("totalRecipesCount");
      if (cached !== null) {
        setTotalRecipes(parseInt(cached));
        return;
      }
      const letters = "abcdefghijklmnopqrstuvwxyz".split("");
      const responses = await Promise.all(
        letters.map((l) =>
          axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?f=${l}`)
        )
      );
      const count = responses.reduce(
        (sum, res) => sum + (res.data.meals ? res.data.meals.length : 0),
        0
      );
      setTotalRecipes(count);
      await AsyncStorage.setItem("totalRecipesCount", String(count));
    } catch (err) {
      console.log("Error fetching recipe count:", err);
    }
  };

  const loadStats = async () => {
    try {
      const storedMeals = await AsyncStorage.getItem("weeklyMeals");
      setWeeklyMeals(storedMeals ? JSON.parse(storedMeals) : []);

      // key used by Calories.js is "dailyGoal"
      const storedGoal = await AsyncStorage.getItem("dailyGoal");
      if (storedGoal !== null) setDailyGoal(parseInt(storedGoal));
    } catch (err) {
      console.log("Error loading stats:", err);
    }
  };

  // same calorie formula as MealPlanner & Calories screens
  const getCalories = (recipe) => {
    if (!recipe) return 0;
    let count = 0;
    for (let i = 1; i <= 20; i++) {
      if (recipe[`strIngredient${i}`] && recipe[`strIngredient${i}`].trim())
        count++;
    }
    return count * 50;
  };

  const getTodayCalories = () => {
    const today = new Date().toDateString();
    return weeklyMeals
      .filter((m) => new Date(m.date).toDateString() === today)
      .reduce((sum, m) => sum + getCalories(m.recipe), 0);
  };

  const get7DayAverage = () => {
    if (weeklyMeals.length === 0) return 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7 = weeklyMeals.filter((m) => new Date(m.date) >= sevenDaysAgo);
    if (last7.length === 0) return 0;
    const total = last7.reduce((sum, m) => sum + getCalories(m.recipe), 0);
    return Math.round(total / 7);
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access gallery is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      await AsyncStorage.setItem("profileImage", result.assets[0].uri);
    }
  };

  const openEditModal = () => {
    setEditName(username);
    setEditImageUrl("");
    setEditModalVisible(true);
  };

  const pickImageInModal = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access gallery is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      await AsyncStorage.setItem("profileImage", result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const user = userData ? JSON.parse(userData) : {};
      user.name = editName;
      await AsyncStorage.setItem("userData", JSON.stringify(user));
      setUsername(editName);
      if (editImageUrl.trim() !== "") {
        setProfileImage(editImageUrl.trim());
        await AsyncStorage.setItem("profileImage", editImageUrl.trim());
      }
      setEditModalVisible(false);
    } catch (error) {
      console.log("Error saving profile:", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* ── Hero ── */}
      <ImageBackground
        source={{
          uri: "https://myplantin.com/_next/image?url=https%3A%2F%2Fstrapi.myplantin.com%2Fgrowing_dragon_fruit_picture.webp%3Fheight%3D1414%26width%3D2121&w=1920&q=75",
        }}
        style={styles.hero}
        imageStyle={{ borderRadius: 20 }}
      >
        <View style={styles.overlay}>
          <View style={styles.profileRow}>
            <TouchableOpacity onPress={pickImage}>
              <Image
                source={
                  profileimage
                    ? { uri: profileimage }
                    : require("../Download.png")
                }
                style={styles.image}
              />
            </TouchableOpacity>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.heroTitle}>{username}</Text>
              <Text style={styles.heroSub}>{email}</Text>
            </View>
          </View>
          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      {/* ── Stats Cards ── */}
      <ScrollView
       // horizontal
       // showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
        contentContainerStyle={{ gap: 10, paddingRight: 10 }}
      >
        {/* Total Recipes (from MealDB a-z fetch) */}
        <View style = {{flexDirection:'row', justifyContent: 'center'}}>
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statLabel}>Total Meals</Text>
            <Text style={styles.statIcon}>🍽️</Text>
          </View>
          <Text style={styles.statValue}>
            {totalRecipes > 0 ? totalRecipes : "—"}
          </Text>
          <Text style={styles.statSub}>recipes available</Text>
        </View>

        {/* Today's Intake from weeklyMeals */}
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statLabel}>Today's Intake</Text>
            <Text style={styles.statIcon}>📈</Text>
          </View>
          <Text style={styles.statValue}>{getTodayCalories()}</Text>
          <Text style={styles.statSub}>calories today</Text>
        </View>

        </View>
        {/* 7-Day Average from weeklyMeals */}
        <View style = {{flexDirection: 'row', justifyContent: 'center'}}>
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statLabel}>7-Day Average</Text>
            <Text style={styles.statIcon}>📊</Text>
          </View>
          <Text style={styles.statValue}>{get7DayAverage()}</Text>
          <Text style={styles.statSub}>calories/day</Text>
        </View>

        {/* Daily Goal from Calories screen ("dailyGoal" key) */}
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statLabel}>Daily Goal</Text>
            <Text style={styles.statIcon}>🎯</Text>
          </View>
          <Text style={styles.statValue}>{dailyGoal}</Text>
          <Text style={styles.statSub}>target calories</Text>
        </View>
        </View>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.modalSubtitle}>
              Update your profile information and avatar
            </Text>

            <View style={styles.avatarContainer}>
              {profileimage ? (
                <Image
                  source={{ uri: profileimage }}
                  style={styles.modalAvatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {username ? username[0].toUpperCase() : "?"}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.fieldLabel}>Profile Picture</Text>
            <TouchableOpacity
              style={styles.fileInput}
              onPress={pickImageInModal}
            >
              <Text style={styles.fileInputText}>
                Choose File   No file chosen
              </Text>
            </TouchableOpacity>

            <Text style={styles.orText}>Or paste an image URL below</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/avatar.jpg"
              placeholderTextColor="#aaa"
              value={editImageUrl}
              onChangeText={setEditImageUrl}
            />

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholderTextColor="#aaa"
            />

            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              editable={false}
            />
            <Text style={styles.hintText}>Email cannot be changed</Text>

            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 15,
  },
  hero: {
    height: 180,
    justifyContent: "center",
    marginBottom: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    height: 100,
    width: 100,
    borderRadius: 100,
  },
  heroTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  heroSub: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontSize: 13,
  },
  heroButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  editButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  editButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "500",
  },

  // stat cards
  statCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    width: 140,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
    justifyContent: "space-between",
  },
  statCardHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
    flex: 1,
  },
  statIcon: { fontSize: 16 },
  statValue: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 2,
  },
  statSub: { fontSize: 11, color: "#aaa" },

  // modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "88%",
    maxWidth: 400,
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 16,
    zIndex: 1,
  },
  closeButtonText: { fontSize: 18, color: "#666" },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
    color: "#111",
  },
  modalSubtitle: { fontSize: 13, color: "#888", marginBottom: 20 },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  modalAvatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e8e8e8",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 28, fontWeight: "500", color: "#666" },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    color: "#111",
  },
  fileInput: {
    backgroundColor: "#f3f3f3",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fileInputText: { fontSize: 13, color: "#555" },
  orText: { fontSize: 12, color: "#aaa", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111",
    backgroundColor: "#f9f9f9",
    marginBottom: 14,
  },
  disabledInput: { color: "#aaa", backgroundColor: "#f3f3f3" },
  hintText: { fontSize: 12, color: "#aaa", marginTop: -10, marginBottom: 16 },
  saveButton: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  saveButtonText: { color: "white", fontSize: 15, fontWeight: "600" },
});

