import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  ImageBackground,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export default function MealPlannerScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [weeklyMeals, setWeeklyMeals] = useState([]);
  const [servings, setServings] = useState(1);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState("");

  const weekDays = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ];

  useEffect(() => {
    fetchRecipes();
    loadMeals();
  }, []);

  useEffect(() => {
    if (weeklyMeals.length > 0) saveMeals(weeklyMeals);
  }, [weeklyMeals]);

  // ── AsyncStorage helpers ──
  const saveMeals = async (meals) => {
    try {
      await AsyncStorage.setItem("weeklyMeals", JSON.stringify(meals));
    } catch (err) {
      console.log("Error saving meals:", err);
    }
  };

  const loadMeals = async () => {
    try {
      const stored = await AsyncStorage.getItem("weeklyMeals");
      if (stored !== null) setWeeklyMeals(JSON.parse(stored));
    } catch (err) {
      console.log("Error loading meals:", err);
    }
  };

  // ── Fetch all recipes from MealDB ──
  const fetchRecipes = async () => {
    try {
      const letters = "abcdefghijklmnopqrstuvwxyz".split("");
      const responses = await Promise.all(
        letters.map((letter) =>
          axios.get(
            `https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`
          )
        )
      );
      const merged = responses.flatMap((res) => res.data.meals || []);
      setRecipes(merged);
    } catch (err) {
      console.log("Error fetching recipes:", err);
    }
  };

  // ── Extract ingredients from a MealDB recipe ──
  const getIngredients = (recipe) => {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = recipe[`strIngredient${i}`];
      const meas = recipe[`strMeasure${i}`];
      if (ing && ing.trim()) {
        ingredients.push({
          name: ing.trim(),
          qty: meas ? meas.trim() : "—",
        });
      }
    }
    return ingredients;
  };

  // ── Push ingredients to the shared grocery list in AsyncStorage ──
  const syncIngredientsToGrocery = async (recipe) => {
    try {
      const stored = await AsyncStorage.getItem("groceryItems");
      const existing = stored ? JSON.parse(stored) : [];

      const ingredients = getIngredients(recipe);
      const newItems = ingredients.map((ing) => ({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        name: ing.name,
        qty: ing.qty,
        checked: false,
        source: recipe.strMeal, // shows "from [Recipe Name]" in grocery list
      }));

      const updated = [...existing, ...newItems];
      await AsyncStorage.setItem("groceryItems", JSON.stringify(updated));

      Alert.alert(
        "Grocery List Updated",
        `${newItems.length} ingredient${newItems.length !== 1 ? "s" : ""} from "${recipe.strMeal}" added to your grocery list!`,
        [{ text: "OK" }]
      );
    } catch (err) {
      console.log("Error syncing ingredients:", err);
    }
  };

  // ── Add meal + sync its ingredients to grocery ──
  const addMeal = async () => {
    if (!selectedRecipe) return;

    const newMeal = {
      date: selectedDate.toDateString(),
      recipe: selectedRecipe,
    };
    const updated = [...weeklyMeals, newMeal];
    setWeeklyMeals(updated);
    saveMeals(updated);

    // Sync ingredients to grocery list
    await syncIngredientsToGrocery(selectedRecipe);

    setModalVisible(false);
    setSelectedRecipe(null);
    setServings(1);
    setRecipeSearch("");
  };

  const getCalories = (recipe) => {
    if (!recipe) return 0;
    let count = 0;
    for (let i = 1; i <= 20; i++) {
      if (recipe[`strIngredient${i}`] && recipe[`strIngredient${i}`].trim()) count++;
    }
    return count * 50;
  };

  const filteredRecipes = recipes.filter((r) =>
    r.strMeal.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  const openRecipePicker = () => {
    setModalVisible(false);
    setTimeout(() => setShowRecipePicker(true), 400);
  };

  const handleRecipeSelect = (item) => {
    setSelectedRecipe(item);
    setShowRecipePicker(false);
    setTimeout(() => setModalVisible(true), 400);
  };

  const cancelRecipePicker = () => {
    setShowRecipePicker(false);
    setTimeout(() => setModalVisible(true), 400);
  };

  return (
    <ScrollView style={styles.container}>
      {/* ── Hero ── */}
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1547592180-85f173990554",
        }}
        style={styles.hero}
        imageStyle={{ borderRadius: 20 }}
      >
        <View style={styles.overlay}>
          <Text style={styles.heroTitle}>Meal Planner</Text>
          <Text style={styles.heroSub}>Plan your meals for the week</Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addButtonText}>+ Add Meal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      {/* ── Date Selector ── */}
      <View style={styles.calendarBox}>
        <Text style={styles.sectionTitle}>Select a day to add meals</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowCalendar(true)}
        >
          <Text style={styles.dateButtonText}>📅  {selectedDate.toDateString()}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Week View ── */}
      <Text style={styles.sectionTitle}>Week View</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 20 }}
        contentContainerStyle={{ paddingRight: 10 }}
      >
        {weekDays.map((day) => {
          const mealsForDay = weeklyMeals.filter(
            (meal) =>
              new Date(meal.date).toLocaleDateString("en-US", {
                weekday: "long",
              }) === day
          );
          const hasMeals = mealsForDay.length > 0;

          return (
            <View
              key={day}
              style={[
                styles.weekCard,
                hasMeals ? styles.weekCardExpanded : styles.weekCardCompact,
              ]}
            >
              <Text style={styles.weekDate}>{day.slice(0, 3)}</Text>
              {hasMeals ? (
                <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {mealsForDay.map((meal, index) => (
                    <View key={index} style={styles.mealBox}>
                      <Text style={styles.mealName} numberOfLines={2}>
                        {meal.recipe.strMeal}
                      </Text>
                      <Text style={styles.mealCategory}>
                        {meal.recipe.strCategory}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noMealText}>—</Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* ── Planned Meals List ── */}
      {weeklyMeals.length > 0 && (
        <View style={styles.mealsListCard}>
          <Text style={styles.sectionTitle}>Planned Meals</Text>
          <Text style={styles.mealsListSub}>{weeklyMeals.length} meals · ingredients synced to grocery list</Text>
          {weeklyMeals.map((meal, index) => (
            <View key={index} style={styles.plannedMealRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.plannedMealName}>{meal.recipe.strMeal}</Text>
                <Text style={styles.plannedMealDate}>
                  {new Date(meal.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })} · {meal.recipe.strCategory} · {getIngredients(meal.recipe).length} ingredients
                </Text>
              </View>
              <View style={styles.syncedBadge}>
                <Text style={styles.syncedBadgeText}>✓ synced</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── MODAL 1: Date Picker ── */}
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.dateModalBg}>
          <View style={styles.dateModalBox}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Select Date</Text>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, date) => {
                if (Platform.OS === "android") setShowCalendar(false);
                if (date) setSelectedDate(date);
              }}
              style={{ alignSelf: "center" }}
            />
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: Add Meal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Add Meal</Text>

            <TouchableOpacity
              style={styles.pickerReplacement}
              onPress={openRecipePicker}
            >
              <Text
                style={
                  selectedRecipe
                    ? styles.pickerValueText
                    : styles.pickerPlaceholderText
                }
              >
                {selectedRecipe
                  ? `${selectedRecipe.strMeal} (${getCalories(selectedRecipe)} cal)`
                  : "Select Recipe"}
              </Text>
              <Text style={styles.pickerArrow}>›</Text>
            </TouchableOpacity>

            {selectedRecipe && (
              <View style={styles.ingredientPreview}>
                <Text style={styles.ingredientPreviewText}>
                  🛒  {getIngredients(selectedRecipe).length} ingredients will be added to your Grocery List
                </Text>
              </View>
            )}

            <View style={styles.servingContainer}>
              <Text style={styles.servingLabel}>Servings</Text>
              <View style={styles.servingControls}>
                <TouchableOpacity
                  style={styles.arrowBtn}
                  onPress={() => servings > 1 && setServings(servings - 1)}
                >
                  <Text style={styles.arrowText}>▼</Text>
                </TouchableOpacity>
                <Text style={styles.servingText}>{servings}</Text>
                <TouchableOpacity
                  style={styles.arrowBtn}
                  onPress={() => setServings(servings + 1)}
                >
                  <Text style={styles.arrowText}>▲</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, !selectedRecipe && styles.confirmBtnDisabled]}
              onPress={addMeal}
              disabled={!selectedRecipe}
            >
              <Text style={styles.confirmBtnText}>
                Add Meal 
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: Recipe Picker ── */}
      <Modal visible={showRecipePicker} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { maxHeight: "85%" }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Select Recipe</Text>

            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search recipes..."
                placeholderTextColor="#aaa"
                value={recipeSearch}
                onChangeText={setRecipeSearch}
                autoCorrect={false}
              />
            </View>

            {recipes.length === 0 && (
              <Text style={styles.loadingText}>Loading recipes...</Text>
            )}

            <FlatList
              data={filteredRecipes}
              keyExtractor={(item) => item.idMeal}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={10}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.recipePickerRow}
                  onPress={() => handleRecipeSelect(item)}
                >
                  <Text style={styles.recipePickerName}>{item.strMeal}</Text>
                  <Text style={styles.recipePickerCal}>
                    {item.strCategory} · {getCalories(item)} cal · {getIngredients(item).length} ingredients
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: "#eee" }} />
              )}
            />

            <TouchableOpacity
              style={{ marginTop: 15, alignItems: "center" }}
              onPress={cancelRecipePicker}
            >
              <Text style={styles.cancelText}>Cancel</Text>
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
  addButton: {
    backgroundColor: "white",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
  calendarBox: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 15,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  dateButton: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  dateButtonText: {
    fontSize: 14,
    color: "#111",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111",
  },
  weekCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginRight: 8,
    padding: 10,
    width: 85,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  weekCardCompact: {
    height: 75,
  },
  weekCardExpanded: {
    maxHeight: 200,
  },
  weekDate: {
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 6,
    textAlign: "center",
    color: "#333",
  },
  noMealText: {
    color: "#ccc",
    textAlign: "center",
    marginTop: 6,
    fontSize: 16,
  },
  mealBox: {
    backgroundColor: "#f3f3f3",
    padding: 5,
    borderRadius: 7,
    marginBottom: 4,
  },
  mealName: {
    fontSize: 10,
    fontWeight: "600",
    color: "#333",
  },
  mealCategory: {
    fontSize: 9,
    color: "#888",
    marginTop: 1,
  },
  mealsListCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  mealsListSub: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
    marginBottom: 12,
  },
  plannedMealRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    gap: 10,
  },
  plannedMealName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  plannedMealDate: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  syncedBadge: {
    backgroundColor: "#e6f4ea",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  syncedBadgeText: {
    fontSize: 11,
    color: "#2d6a4f",
    fontWeight: "600",
  },
  modalBg: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalBox: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#111",
  },
  pickerReplacement: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  pickerPlaceholderText: {
    color: "#aaa",
    fontSize: 15,
    flex: 1,
  },
  pickerValueText: {
    color: "#000",
    fontSize: 15,
    flex: 1,
  },
  pickerArrow: {
    fontSize: 22,
    color: "#aaa",
  },
  ingredientPreview: {
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    marginBottom: 6,
  },
  ingredientPreviewText: {
    fontSize: 13,
    color: "#2d6a4f",
  },
  servingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  servingLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  servingControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  arrowBtn: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  arrowText: {
    fontSize: 16,
    color: "#333",
  },
  servingText: {
    fontSize: 18,
    fontWeight: "bold",
    minWidth: 24,
    textAlign: "center",
    color: "#111",
  },
  confirmBtn: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
    alignItems: "center",
  },
  confirmBtnDisabled: {
    backgroundColor: "#ccc",
  },
  confirmBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelText: {
    marginTop: 14,
    textAlign: "center",
    color: "#888",
    fontSize: 14,
  },
  searchRow: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    paddingVertical: 10,
    fontSize: 15,
    color: "#000",
  },
  loadingText: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 13,
    paddingVertical: 20,
  },
  recipePickerRow: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  recipePickerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  recipePickerCal: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  dateModalBg: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  dateModalBox: {
    backgroundColor: "black",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
});