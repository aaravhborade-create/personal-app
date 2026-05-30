import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function GroceryListScreen() {
  const [groceryItems, setGroceryItems] = useState([]);
  const [shoppingDay, setShoppingDay] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");

  // Load saved data on mount
  useEffect(() => {
    loadGroceryItems();
    loadShoppingDay();
  }, []);

  // ── Persist whenever items change ──
  useEffect(() => {
    saveGroceryItems(groceryItems);
  }, [groceryItems]);

  const saveGroceryItems = async (items) => {
    try {
      await AsyncStorage.setItem("groceryItems", JSON.stringify(items));
    } catch (err) {
      console.log("Error saving grocery items:", err);
    }
  };

  const loadGroceryItems = async () => {
    try {
      const stored = await AsyncStorage.getItem("groceryItems");
      if (stored !== null) setGroceryItems(JSON.parse(stored));
    } catch (err) {
      console.log("Error loading grocery items:", err);
    }
  };

  const saveShoppingDay = async (date) => {
    try {
      await AsyncStorage.setItem("shoppingDay", date.toISOString());
    } catch (err) {
      console.log("Error saving shopping day:", err);
    }
  };

  const loadShoppingDay = async () => {
    try {
      const stored = await AsyncStorage.getItem("shoppingDay");
      if (stored !== null) setShoppingDay(new Date(stored));
    } catch (err) {
      console.log("Error loading shopping day:", err);
    }
  };

  const toggleItem = (id) => {
    const updated = groceryItems.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setGroceryItems(updated);
  };

  const deleteItem = (id) => {
    const updated = groceryItems.filter((item) => item.id !== id);
    setGroceryItems(updated);
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      qty: newItemQty.trim() || "—",
      checked: false,
      source: null,
    };
    const updated = [...groceryItems, newItem];
    setGroceryItems(updated);
    saveGroceryItems(updated);
    setNewItemName("");
    setNewItemQty("");
    setShowAddModal(false);
  };

  const totalItems = groceryItems.length;
  const checkedItems = groceryItems.filter((i) => i.checked).length;

  const formatShoppingDay = (date) => {
    if (!date) return "Not set";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
  };

  const formatShoppingDayFull = (date) => {
    if (!date) return "—";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* ── Hero ── */}
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
        }}
        style={styles.hero}
        imageStyle={{ borderRadius: 20 }}
      >
        <View style={styles.overlay}>
          <Text style={styles.heroTitle}>Grocery List</Text>
          <Text style={styles.heroSub}>Manage your shopping list</Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.heroBtnText}>+ Add Item</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => setShowCalendar(true)}
            >
              <Text style={styles.heroBtnText}>📅 Set Shopping Day</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      {/* ── Stat Cards ── */}
      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Items to Buy</Text>
            <Text style={styles.statIcon}>🛒</Text>
          </View>
          <Text style={styles.statValue}>{totalItems - checkedItems}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Items Checked</Text>
            <Text style={styles.statIcon}>☑️</Text>
          </View>
          <Text style={styles.statValue}>{checkedItems}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Shopping Day</Text>
            <Text style={styles.statIcon}>📅</Text>
          </View>
          <Text style={[styles.statValue, { fontSize: 18 }]}>
            {formatShoppingDay(shoppingDay)}
          </Text>
        </View>
      </View>

      {/* ── Planned Shopping Day Banner ── */}
      {shoppingDay && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Planned Shopping Day</Text>
          <Text style={styles.sectionValue}>
            {formatShoppingDayFull(shoppingDay)}
          </Text>
        </View>
      )}

      {/* ── Shopping List ── */}
      <View style={[styles.sectionCard, { marginBottom: 30 }]}>
        <Text style={styles.sectionTitle}>Shopping List</Text>
        <Text style={styles.sectionSub}>{totalItems} total items</Text>

        {groceryItems.length === 0 ? (
          <Text style={styles.emptyText}>
            No items yet. Add items manually or add a meal in the Meal Planner
            to auto-populate ingredients!
          </Text>
        ) : (
          groceryItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <TouchableOpacity
                style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                onPress={() => toggleItem(item.id)}
              >
                {item.checked && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
              <View style={styles.itemInfo}>
                <Text
                  style={[
                    styles.itemName,
                    item.checked && styles.itemNameChecked,
                  ]}
                >
                  {item.name}
                </Text>
                <Text style={styles.itemQty}>{item.qty}</Text>
                {item.source && (
                  <Text style={styles.itemSource}>from {item.source}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => deleteItem(item.id)}>
                <Text style={styles.deleteBtn}>🗑</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* ── MODAL: Add Item ── */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Add Item</Text>

            <Text style={styles.fieldLabel}>Item name</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Tomatoes"
              value={newItemName}
              onChangeText={setNewItemName}
            />

            <Text style={styles.fieldLabel}>Quantity</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. 200g, 2 pcs"
              value={newItemQty}
              onChangeText={setNewItemQty}
            />

            <TouchableOpacity style={styles.confirmBtn} onPress={addItem}>
              <Text style={styles.confirmBtnText}>Add to list</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: Calendar / Date Picker ── */}
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.calModalBg}>
          <View style={styles.calModalBox}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Set Shopping Day</Text>
            <DateTimePicker
              value={shoppingDay || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, date) => {
                if (Platform.OS === "android") setShowCalendar(false);
                if (date) {
                  setShoppingDay(date);
                  saveShoppingDay(date);
                }
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
  heroBtn: {
    backgroundColor: "white",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  heroBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
  statRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: "#888",
    flexShrink: 1,
  },
  statIcon: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  sectionLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 14,
    color: "#111",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
  },
  sectionSub: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#aaa",
    textAlign: "center",
    paddingVertical: 20,
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  checkmark: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  itemNameChecked: {
    textDecorationLine: "line-through",
    color: "#aaa",
  },
  itemQty: {
    fontSize: 12,
    color: "#888",
    marginTop: 1,
  },
  itemSource: {
    fontSize: 11,
    color: "#bbb",
    fontStyle: "italic",
    marginTop: 1,
  },
  deleteBtn: {
    fontSize: 18,
    padding: 4,
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
    color: "#111",
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  fieldInput: {
    borderWidth: 0.5,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111",
    backgroundColor: "#f9f9f9",
    marginBottom: 12,
  },
  confirmBtn: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  confirmBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelText: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    paddingTop: 14,
  },
  calModalBg: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  calModalBox: {
    backgroundColor: "black",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
});