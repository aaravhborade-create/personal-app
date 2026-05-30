import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  ImageBackground
} from "react-native";
import axios from "axios";

const { width } = Dimensions.get("window");

export default function App() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchMeals();
  }, []);

const fetchMeals = async () => {
  setLoading(true);

  try {
    const letters = "abcdefghijklmnopqrstuvwxyz".split("");

    const responses = await Promise.all(
      letters.map((letter) =>
        axios.get(
          `https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`
        )
      )
    );

    const mergedMeals = responses.flatMap(
      (res) => res.data.meals || []
    );

    const uniqueMeals = mergedMeals.filter(
      (meal, index, self) =>
        index === self.findIndex((m) => m.idMeal === meal.idMeal)
    );

    setMeals(uniqueMeals);
  } catch (err) {
    console.log(err);
  } finally {
    setLoading(false);
  }
};

  const openModal = async (meal) => {
    try {
      const res = await axios.get(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
      );
      setSelectedMeal(res.data.meals[0]);
      setModalVisible(true);
    } catch (err) {
      console.log(err);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <Image source={{ uri: item.strMealThumb }} style={styles.image} />
      <Text numberOfLines={1} style={styles.cardTitle}>
        {item.strMeal}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ImageBackground
        source={{
          uri: "https://m.media-amazon.com/images/I/81kwo8apxnL._AC_SL1500_.jpg",
        }}
        style={styles.hero}
        imageStyle={{ borderRadius: 20 }}
      >
        <View style={styles.overlay}>
          <Text style={styles.heroTitle}>Recipes</Text>
          <Text style={styles.heroSub}>Manage you recipe collection</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >

          </TouchableOpacity>
        </View>
      </ImageBackground>
   


      <FlatList
        data={meals}
        keyExtractor={(item) => item.idMeal}
        renderItem={renderItem}
        numColumns={3}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            {selectedMeal && (
              <ScrollView>
                <Image
                  source={{ uri: selectedMeal.strMealThumb }}
                  style={styles.modalImage}
                />

                <View style={{ padding: 15 }}>
                  <Text style={styles.modalTitle}>
                    {selectedMeal.strMeal}
                  </Text>

                  <Text style={styles.sectionTitle}>Ingredients</Text>

                  {Array.from({ length: 20 }).map((_, i) => {
                    const ing =
                      selectedMeal[`strIngredient${i + 1}`];
                    const meas =
                      selectedMeal[`strMeasure${i + 1}`];

                    if (ing) {
                      return (
                        <Text key={i}>
                          • {ing} - {meas}
                        </Text>
                      );
                    }
                  })}

                  <Text style={styles.sectionTitle}>
                    Instructions
                  </Text>
                  <Text>{selectedMeal.strInstructions}</Text>

                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={{ color: "#fff" }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
  </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  card: {
    flex: 1,
    margin: 5,
    alignItems: "center",
  },
  image: {
    width: width / 3 - 15,
    height: 100,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 10,
    maxHeight: "90%",
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  closeBtn: {
    backgroundColor: "#e74c3c",
    padding: 10,
    marginTop: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
  },
  heroTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  heroSub: {
    color: "white",
    marginTop: 5,
  },
    hero: {
    height: 180,
    justifyContent: "center",
    marginBottom: 20,
  }
});
