import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";

const getCalories = (recipe) => {
  if (!recipe) return 0;
  let count = 0;
  for (let i = 1; i <= 20; i++) {
    if (recipe[`strIngredient${i}`]) count++;
  }
  return count * 50;
};

const getCaloriesForDate = (weeklyMeals, dateString) => {
  return weeklyMeals
    .filter((m) => m.date === dateString)
    .reduce((sum, m) => sum + getCalories(m.recipe), 0);
};

// ── Weekly Graph ──
function WeeklyGraph({ weekBars, dailyGoal }) {
  const [tappedBar, setTappedBar] = useState(null); // { label, cal, x, y }
  const GRAPH_HEIGHT = 180;
  const maxY = Math.max(dailyGoal, 2000);
  const Y_LABELS = [2000, 1500, 1000, 500, 0];

  const handleBarPress = (bar) => {
    if (tappedBar && tappedBar.label === bar.label) {
      setTappedBar(null); // tap same bar again to dismiss
    } else {
      setTappedBar(bar);
    }
  };

  return (
    <View style={gStyles.wrapper}>
      <Text style={gStyles.title}>Weekly Overview</Text>
      <Text style={gStyles.subtitle}>Calorie intake for the current week</Text>

      <View style={gStyles.graphArea}>
        {/* Y-axis */}
        <View style={gStyles.yAxis}>
          {Y_LABELS.map((val) => (
            <Text key={val} style={gStyles.yLabel}>
              {val === 0 ? "0" : val >= 1000 ? `${val / 1000}k` : val}
            </Text>
          ))}
        </View>

        {/* Chart body */}
        <View style={[gStyles.chartBody, { height: GRAPH_HEIGHT + 24 }]}>
          {/* Grid lines */}
          {[0, 500, 1000, 1500, 2000].map((val) => (
            <View
              key={val}
              style={[
                gStyles.gridLine,
                { bottom: 24 + (val / maxY) * GRAPH_HEIGHT },
              ]}
            />
          ))}

          {/* Goal dashed line */}
          <View
            style={[
              gStyles.goalLine,
              { bottom: 24 + (dailyGoal / maxY) * GRAPH_HEIGHT },
            ]}
          />

          {/* Bars */}
          <View style={gStyles.barsRow}>
            {weekBars.map((bar) => {
              const { label, cal, isToday } = bar;
              const barHeight = cal > 0 ? (cal / maxY) * GRAPH_HEIGHT : 0;
              const overGoal = cal > dailyGoal;
              const isTapped = tappedBar && tappedBar.label === label;

              return (
                <TouchableOpacity
                  key={label}
                  style={gStyles.barCol}
                  onPress={() => handleBarPress(bar)} 
                  activeOpacity={0.7}
                >
                  {/* Tap popup above bar */}
                  {isTapped && (
                    <View style={gStyles.popup}>
                      <Text style={gStyles.popupDay}>{label}</Text>
                      <Text style={gStyles.popupIntake}>🔥 {cal} cal</Text>
                      <Text style={gStyles.popupGoal}>◎ {dailyGoal} goal</Text>
                      <Text
                        style={[
                          gStyles.popupStatus,
                          { color: overGoal ? "#e74c3c" : "#2e7d32" },
                        ]}
                      >
                        {cal === 0
                          ? "No data"
                          : overGoal
                          ? `+${cal - dailyGoal} over`
                          : `${dailyGoal - cal} under`}
                      </Text>
                    </View>
                  )}

                  {/* Bar */}
                  <View style={gStyles.barTrack}>
                    <View
                      style={[
                        gStyles.barFill,
                        {
                          height: barHeight,
                          backgroundColor: isTapped
                            ? "#1a4a7a"
                            : overGoal
                            ? "#e74c3c"
                            : isToday
                            ? "#2d6a9f"
                            : "#b0c8e8",
                        },
                      ]}
                    />
                  </View>

                  {/* Day label */}
                  <Text
                    style={[
                      gStyles.dayLabel,
                      isToday && gStyles.dayLabelToday,
                      isTapped && gStyles.dayLabelTapped,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Legend */}
      <View style={gStyles.legend}>
        <View style={gStyles.legendItem}>
          <View style={[gStyles.legendDot, { backgroundColor: "#2d6a9f" }]} />
          <Text style={gStyles.legendText}>Intake</Text>
        </View>
        <View style={gStyles.legendItem}>
          <View style={[gStyles.legendDot, { backgroundColor: "#e74c3c" }]} />
          <Text style={gStyles.legendText}>Over Goal</Text>
        </View>
        <View style={gStyles.legendItem}>
          <View style={gStyles.legendDash} />
          <Text style={gStyles.legendText}>Goal ({dailyGoal} cal)</Text>
        </View>
      </View>
      <Text style={gStyles.tapHint}>Tap a bar to see details</Text>
    </View>
  );
}

const gStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    marginBottom: 40,
  },
  title: { fontSize: 16, fontWeight: "bold", color: "#111" },
  subtitle: { fontSize: 12, color: "#888", marginTop: 2, marginBottom: 16 },

  graphArea: { flexDirection: "row" },

  yAxis: {
    width: 36,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 6,
    paddingBottom: 24,
  },
  yLabel: { fontSize: 10, color: "#999" },

  chartBody: {
    flex: 1,
    position: "relative",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },

  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    borderWidth: 0.5,
    borderColor: "#e8e8e8",
    borderStyle: "dashed",
  },

  goalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1.5,
    borderWidth: 1,
    borderColor: "#e74c3c",
    borderStyle: "dashed",
    zIndex: 2,
  },

  barsRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
  },

  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 0,
  },

  // Popup tooltip above bar
  popup: {
    position: "absolute",
    bottom: "100%",
    backgroundColor: "#1c1c1e",
    borderRadius: 10,
    padding: 8,
    marginBottom: 4,
    width: 80,
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  popupDay: { color: "white", fontSize: 11, fontWeight: "bold", marginBottom: 3 },
  popupIntake: { color: "#ffa500", fontSize: 11, marginBottom: 2 },
  popupGoal: { color: "#aaa", fontSize: 10, marginBottom: 2 },
  popupStatus: { fontSize: 10, fontWeight: "600" },

  barTrack: {
    width: 22,
    height: 180,
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderRadius: 4,
  },

  dayLabel: { fontSize: 10, color: "#888", marginTop: 5, height: 20 },
  dayLabelToday: { color: "#2d6a9f", fontWeight: "bold" },
  dayLabelTapped: { color: "#1a4a7a", fontWeight: "bold" },

  legend: { flexDirection: "row", gap: 14, marginTop: 12, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendDash: { width: 16, height: 2, backgroundColor: "#e74c3c" },
  legendText: { fontSize: 11, color: "#666" },
  tapHint: { fontSize: 11, color: "#bbb", marginTop: 6, textAlign: "center" },
});

// ── Main Screen ──
export default function CalorieScreen({ navigation }) {
  const [weeklyMeals, setWeeklyMeals] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [tempGoal, setTempGoal] = useState(2000);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const todayString = new Date().toDateString();
  const selectedDateString = selectedDate.toDateString();
  const isToday = selectedDateString === todayString;

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem("weeklyMeals");
        if (stored !== null) setWeeklyMeals(JSON.parse(stored));
        const savedGoal = await AsyncStorage.getItem("dailyGoal");
        if (savedGoal !== null) {
          const parsed = parseInt(savedGoal);
          setDailyGoal(parsed);
          setTempGoal(parsed);
        }
      } catch (err) {
        console.log("Error loading:", err);
      }
    };
    loadData();
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation]);

  const saveGoal = async (goal) => {
    try {
      await AsyncStorage.setItem("dailyGoal", String(goal));
    } catch (err) {
      console.log("Error saving goal:", err);
    }
  };

  const todayIntake = useMemo(
    () => getCaloriesForDate(weeklyMeals, todayString),
    [weeklyMeals, todayString]
  );
  const remaining = Math.max(0, dailyGoal - todayIntake);

  const { weeklyAverage, weekBars } = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const bars = labels.map((label, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - dayOfWeek + i);
      const cal = getCaloriesForDate(weeklyMeals, d.toDateString());
      return { label, cal, isToday: i === dayOfWeek };
    });
    const nonZero = bars.map((b) => b.cal).filter((c) => c > 0);
    const avg =
      nonZero.length === 0
        ? 0
        : Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length);
    return { weeklyAverage: avg, weekBars: bars };
  }, [weeklyMeals]);

  const selectedIntake = useMemo(
    () => getCaloriesForDate(weeklyMeals, selectedDateString),
    [weeklyMeals, selectedDateString]
  );
  const selectedRemaining = Math.max(0, dailyGoal - selectedIntake);
  const selectedProgressPercent = Math.min(
    100,
    Math.round((selectedIntake / dailyGoal) * 100)
  );
  const selectedMeals = weeklyMeals.filter((m) => m.date === selectedDateString);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Hero ── */}
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800" }}
        style={styles.hero}
        imageStyle={{ borderRadius: 20 }}
      >
        <View style={styles.overlay}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroTitle}>Calorie Intake</Text>
              <Text style={styles.heroSub}>Track your daily calorie consumption</Text>
            </View>
            <TouchableOpacity
              style={styles.goalBtn}
              onPress={() => { setTempGoal(dailyGoal); setGoalModalVisible(true); }}
            >
              <Text style={styles.goalBtnIcon}>◎</Text>
              <Text style={styles.goalBtnText}>Set Daily Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      {/* ── 4 Stat Cards ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>Today's Intake</Text>
            <Text style={styles.statIcon}>🔥</Text>
          </View>
          <Text style={styles.statValue}>{todayIntake}</Text>
          <Text style={styles.statSub}>calories consumed</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>Daily Goal</Text>
            <Text style={styles.statIcon}>◎</Text>
          </View>
          <Text style={styles.statValue}>{dailyGoal}</Text>
          <Text style={styles.statSub}>calories target</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={styles.statIcon}>↗</Text>
          </View>
          <Text style={[styles.statValue, todayIntake > dailyGoal && styles.overText]}>
            {remaining}
          </Text>
          <Text style={styles.statSub}>calories left</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>Weekly{"\n"}Average</Text>
            <Text style={styles.statIcon}>📅</Text>
          </View>
          <Text style={styles.statValue}>{weeklyAverage}</Text>
          <Text style={styles.statSub}>cal/day this week</Text>
        </View>
      </View>

      {/* ── Select Date Section ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <Text style={styles.calendarSubtitle}>View calorie intake for any day</Text>

        <TouchableOpacity
          style={styles.datePickerBtn}
          onPress={() => setShowCalendar(true)}
        >
          <Text style={styles.datePickerIcon}>📅</Text>
          <Text style={styles.datePickerText}>
            {isToday ? `Today — ${selectedDateString}` : selectedDateString}
          </Text>
          <Text style={styles.datePickerArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.selectedDayBox}>
          <View style={styles.selectedDayStats}>
            <View style={styles.selectedStat}>
              <Text style={styles.selectedStatValue}>{selectedIntake}</Text>
              <Text style={styles.selectedStatLabel}>consumed</Text>
            </View>
            <View style={styles.selectedStatDivider} />
            <View style={styles.selectedStat}>
              <Text style={styles.selectedStatValue}>{dailyGoal}</Text>
              <Text style={styles.selectedStatLabel}>goal</Text>
            </View>
            <View style={styles.selectedStatDivider} />
            <View style={styles.selectedStat}>
              <Text style={[styles.selectedStatValue, selectedIntake > dailyGoal && styles.overText]}>
                {selectedRemaining}
              </Text>
              <Text style={styles.selectedStatLabel}>remaining</Text>
            </View>
          </View>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${selectedProgressPercent}%`,
                  backgroundColor: selectedIntake > dailyGoal ? "#e74c3c" : "#2d6a9f",
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {selectedProgressPercent}% of daily goal
          </Text>
        </View>

        <Text style={styles.mealsForDayTitle}>
          {isToday
            ? "Today's Meals"
            : `Meals on ${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
        </Text>
        {selectedMeals.length === 0 ? (
          <Text style={styles.emptyText}>
            No meals logged{isToday ? " today" : " on this day"}.
          </Text>
        ) : (
          selectedMeals.map((meal, index) => (
            <View key={index} style={styles.mealRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealName}>{meal.recipe.strMeal}</Text>
                <Text style={styles.mealCat}>{meal.recipe.strCategory}</Text>
              </View>
              <Text style={styles.mealCal}>{getCalories(meal.recipe)} cal</Text>
            </View>
          ))
        )}
      </View>

      {/* ── Weekly Graph (below date section) ── */}
      <WeeklyGraph weekBars={weekBars} dailyGoal={dailyGoal} />

      {/* ── Date Picker Modal ── */}
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.dateModalBg}>
          <View style={styles.dateModalBox}>
            <Text style={styles.dateModalTitle}>Select Date</Text>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              themeVariant="dark"
              textColor="white"
              onChange={(event, date) => { if (date) setSelectedDate(date); }}
              style={{ alignSelf: "center", backgroundColor: "transparent" }}
            />
            <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowCalendar(false)}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 12, alignItems: "center" }}
              onPress={() => { setSelectedDate(new Date()); setShowCalendar(false); }}
            >
              <Text style={styles.backToTodayText}>Back to Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Set Daily Goal Modal ── */}
      <Modal visible={goalModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Set Daily Calorie Goal</Text>
            <View style={styles.goalRow}>
              <TouchableOpacity style={styles.arrowBtn} onPress={() => setTempGoal((g) => Math.max(500, g - 50))}>
                <Text style={styles.arrowText}>▼</Text>
              </TouchableOpacity>
              <View style={styles.goalValueBox}>
                <Text style={styles.goalValue}>{tempGoal}</Text>
                <Text style={styles.goalValueSub}>calories / day</Text>
              </View>
              <TouchableOpacity style={styles.arrowBtn} onPress={() => setTempGoal((g) => g + 50)}>
                <Text style={styles.arrowText}>▲</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.presetsRow}>
              {[1500, 1800, 2000, 2200, 2500].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.presetBtn, tempGoal === val && styles.presetActive]}
                  onPress={() => setTempGoal(val)}
                >
                  <Text style={[styles.presetText, tempGoal === val && styles.presetTextActive]}>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => { setDailyGoal(tempGoal); saveGoal(tempGoal); setGoalModalVisible(false); }}
            >
              <Text style={styles.confirmText}>Save Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGoalModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 15 },
  hero: { height: 160, marginBottom: 16 },
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20, padding: 20, justifyContent: "center",
  },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroTitle: { color: "white", fontSize: 26, fontWeight: "bold" },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4, maxWidth: 160 },
  goalBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: "white",
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, gap: 5,
  },
  goalBtnIcon: { fontSize: 13, color: "#333" },
  goalBtnText: { fontSize: 12, fontWeight: "600", color: "#333" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: "white", borderRadius: 12, padding: 10 },
  statTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  statLabel: { fontSize: 10, color: "#666", fontWeight: "600", flex: 1, lineHeight: 13 },
  statIcon: { fontSize: 12 },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#111" },
  statSub: { fontSize: 9, color: "#999", marginTop: 2 },
  overText: { color: "#e74c3c" },
  section: { backgroundColor: "white", borderRadius: 14, padding: 15, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#111", marginBottom: 2 },
  calendarSubtitle: { fontSize: 12, color: "#888", marginBottom: 12 },
  datePickerBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#f0f0f0",
    borderRadius: 12, padding: 14, marginBottom: 16, gap: 8,
  },
  datePickerIcon: { fontSize: 16 },
  datePickerText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#222" },
  datePickerArrow: { fontSize: 20, color: "#999" },
  selectedDayBox: {
    backgroundColor: "#f8f9fb", borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: "#eee",
  },
  selectedDayStats: {
    flexDirection: "row", justifyContent: "space-around",
    alignItems: "center", marginBottom: 14,
  },
  selectedStat: { alignItems: "center", flex: 1 },
  selectedStatValue: { fontSize: 22, fontWeight: "bold", color: "#111" },
  selectedStatLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  selectedStatDivider: { width: 1, height: 36, backgroundColor: "#e0e0e0" },
  progressBg: { height: 10, backgroundColor: "#e8e8e8", borderRadius: 6, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 6 },
  progressLabel: { fontSize: 12, color: "#888", marginTop: 6, textAlign: "right" },
  mealsForDayTitle: { fontSize: 14, fontWeight: "700", color: "#333", marginBottom: 8 },
  mealRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  mealName: { fontSize: 14, fontWeight: "600", color: "#222" },
  mealCat: { fontSize: 12, color: "#888", marginTop: 2 },
  mealCal: { fontSize: 14, fontWeight: "bold", color: "#2d6a9f" },
  emptyText: { color: "#aaa", textAlign: "center", paddingVertical: 16, fontSize: 13 },
  dateModalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  dateModalBox: {
    backgroundColor: "#111", borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 20, paddingBottom: 44,
  },
  dateModalTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 8, color: "white" },
  backToTodayText: { color: "#6ab0ff", fontSize: 14, textAlign: "center" },
  modalBg: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.45)" },
  modalBox: { backgroundColor: "white", margin: 24, borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  goalRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 20 },
  arrowBtn: { width: 48, height: 48, backgroundColor: "#f0f0f0", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  arrowText: { fontSize: 18, color: "#333" },
  goalValueBox: { alignItems: "center", minWidth: 100 },
  goalValue: { fontSize: 36, fontWeight: "bold", color: "#111" },
  goalValueSub: { fontSize: 12, color: "#888", marginTop: 2 },
  presetsRow: { flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" },
  presetBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
    backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#ddd",
  },
  presetActive: { backgroundColor: "#2d6a9f", borderColor: "#2d6a9f" },
  presetText: { fontSize: 13, color: "#555" },
  presetTextActive: { color: "white", fontWeight: "bold" },
  confirmBtn: { backgroundColor: "#111", padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 12, marginTop: 10 },
  confirmText: { color: "white", fontWeight: "bold", fontSize: 15 },
  cancelText: { textAlign: "center", color: "#888", fontSize: 14 },
});