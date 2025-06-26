// ✅ screens/FavoritesScreen.tsx - muestra favoritos reales, navega a detalles y permite quitar
import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useRecipeContext } from '../context/RecipeContext';

const FavoritesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const { favorites, toggleFavorite } = useRecipeContext();

  const renderFavorite = ({ item }: any) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => navigation.navigate('RecipeDetails', { recipe: item })}
    >
      <Image source={item.image} style={styles.recipeImage} />
      <View style={styles.recipeInfo}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.author}>Por: {item.author}</Text>
        <Text style={styles.time}>⏱ {item.time}</Text>
        <Text style={styles.rating}>{'⭐'.repeat(item.rating)}</Text>
      </View>
      <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.heartIcon}>
        <Ionicons name="heart" size={24} color="red" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Favoritos</Text>
      {favorites.length === 0 ? (
        <Text style={styles.emptyText}>No tenés recetas favoritas aún.</Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderFavorite}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#777',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    alignItems: 'center',
  },
  recipeImage: {
    width: 100,
    height: 100,
  },
  recipeInfo: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontWeight: 'bold',
  },
  author: {
    fontSize: 12,
    color: '#555',
  },
  time: {
    fontSize: 12,
    color: '#555',
  },
  rating: {
    color: '#f9a825',
    fontSize: 14,
    marginTop: 5,
  },
  heartIcon: {
    padding: 10,
  },
});

export default FavoritesScreen;