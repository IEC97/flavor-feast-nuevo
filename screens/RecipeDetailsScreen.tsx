// screens/RecipeDetailsScreen.tsx
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '../types';
import { useRecipeContext } from '../context/RecipeContext';

const RecipeDetailsScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { recipe } = route.params as { recipe: Recipe };
  const { toggleFavorite, isFavorite } = useRecipeContext();

  const [portions, setPortions] = useState(1);

  const adjustQuantity = (qty: number) => Math.round(qty * portions);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={recipe.image} style={styles.image} />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(recipe)}>
        <Ionicons
          name={isFavorite(recipe.id) ? 'heart' : 'heart-outline'}
          size={26}
          color={isFavorite(recipe.id) ? 'red' : '#fff'}
        />
      </TouchableOpacity>

      <Text style={styles.title}>{recipe.title}</Text>
      <Text style={styles.meta}>Por: {recipe.author} · Tiempo: {recipe.time}</Text>
      <Text style={styles.rating}>{'⭐'.repeat(recipe.rating)}</Text>
      <Text style={styles.description}>{recipe.description}</Text>

      <Text style={styles.section}>Ingredientes</Text>
      <View style={styles.portionsRow}>
        <TouchableOpacity onPress={() => setPortions(Math.max(1, portions - 1))}>
          <Ionicons name="remove-circle-outline" size={22} />
        </TouchableOpacity>
        <Text style={{ marginHorizontal: 10 }}>{portions} porciones</Text>
        <TouchableOpacity onPress={() => setPortions(portions + 1)}>
          <Ionicons name="add-circle-outline" size={22} />
        </TouchableOpacity>
      </View>
      {recipe.ingredients?.map((ing, index) => (
        <Text key={index}>- {ing.name} ({adjustQuantity(Number(ing.quantity))}g)</Text>
      ))}

      <Text style={styles.section}>Pasos</Text>
      {recipe.steps?.map((step, index) => (
        <View key={index} style={styles.stepCard}>
          {step.image && <Image source={step.image} style={styles.stepImg} />}
          <Text>{index + 1}. {step.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#00000066',
    borderRadius: 20,
    padding: 6,
  },
  favoriteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#00000066',
    borderRadius: 20,
    padding: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  meta: {
    color: '#555',
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    color: '#f9a825',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
  },
  section: {
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
    fontSize: 18,
  },
  portionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCard: {
    marginBottom: 12,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 10,
  },
  stepImg: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 6,
  },
});

export default RecipeDetailsScreen;