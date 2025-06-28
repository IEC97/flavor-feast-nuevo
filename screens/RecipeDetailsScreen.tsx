// screens/RecipeDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe, RootStackParamList } from '../types';
import { useRecipeContext } from '../context/RecipeContext';

const RecipeDetailsScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { recipe } = route.params as { recipe: Recipe };
  const { toggleFavorite, isFavorite, getRecipeDetails } = useRecipeContext();

  const { fromEdit } = route.params || {};

  const [portions, setPortions] = useState(1);
  const [recipeWithDetails, setRecipeWithDetails] = useState<Recipe>(recipe);
  const [loading, setLoading] = useState(false);

  // Cargar ingredientes y pasos al entrar en la pantalla
  useEffect(() => {
    const loadRecipeDetails = async () => {
      setLoading(true);
      try {
        console.log('🔍 Cargando detalles de receta:', recipe.id);
        const completeRecipe = await getRecipeDetails(recipe.id);
        
        if (completeRecipe) {
          setRecipeWithDetails(completeRecipe);
          console.log('✅ Detalles cargados:', {
            ingredients: completeRecipe.ingredients?.length || 0,
            steps: completeRecipe.steps?.length || 0
          });
        } else {
          console.log('⚠️ No se pudieron cargar los detalles, usando receta base');
        }
      } catch (error) {
        console.error('❌ Error al cargar detalles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipeDetails();
  }, [recipe.id, getRecipeDetails]);

  const adjustQuantity = (qty: number) => Math.round(qty * portions);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={recipeWithDetails.image} style={styles.image} />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(recipeWithDetails)}>
        <Ionicons
          name={isFavorite(recipeWithDetails.id) ? 'heart' : 'heart-outline'}
          size={26}
          color={isFavorite(recipeWithDetails.id) ? 'red' : '#fff'}
        />
      </TouchableOpacity>

      <Text style={styles.title}>{recipeWithDetails.title}</Text>
      <Text style={styles.meta}>Por: {recipeWithDetails.author}</Text>
      <Text style={styles.rating}>{'⭐'.repeat(recipeWithDetails.rating)}</Text>
      <Text style={styles.description}>{recipeWithDetails.description}</Text>

      <Text style={styles.section}>Ingredientes</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#23294c" />
          <Text style={styles.loadingText}>Cargando ingredientes...</Text>
        </View>
      ) : (
        <>
          <View style={styles.portionsRow}>
            <TouchableOpacity onPress={() => setPortions(Math.max(1, portions - 1))}>
              <Ionicons name="remove-circle-outline" size={22} />
            </TouchableOpacity>
            <Text style={{ marginHorizontal: 10 }}>{portions} porciones</Text>
            <TouchableOpacity onPress={() => setPortions(portions + 1)}>
              <Ionicons name="add-circle-outline" size={22} />
            </TouchableOpacity>
          </View>
          {recipeWithDetails.ingredients?.map((ing, index) => 
            React.createElement(Text, {
              key: `ingredient-${ing.id || index}`,
              style: styles.ingredientText
            }, `• ${ing.name} (${adjustQuantity(Number(ing.quantity))} ${ing.unit || 'g'})`)
          )}
        </>
      )}

      <Text style={styles.section}>Pasos</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#23294c" />
          <Text style={styles.loadingText}>Cargando pasos...</Text>
        </View>
      ) : (
        recipeWithDetails.steps?.map((step, index) => 
          React.createElement(View, {
            key: `step-${step.order || index}`,
            style: styles.stepCard
          }, [
            step.image ? React.createElement(Image, {
              key: 'image',
              source: step.image,
              style: styles.stepImg
            }) : null,
            React.createElement(Text, {
              key: 'text',
              style: styles.stepText
            }, `${index + 1}. ${step.text || step.description}`)
          ].filter(Boolean))
        )
      )}

      {/* Botón solo si vienes de editar */}
    {fromEdit && (
      <TouchableOpacity
        style={{
          backgroundColor: '#23294c',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
          marginVertical: 16,
        }}
        onPress={() => navigation.navigate('HomeTabs', { screen: 'Mis Recetas'})}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Volver a Mis Recetas</Text>
      </TouchableOpacity>
    )}

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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  ingredientText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    paddingLeft: 8,
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default RecipeDetailsScreen;