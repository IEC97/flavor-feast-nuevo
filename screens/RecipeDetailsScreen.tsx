// screens/RecipeDetailsScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe, RootStackParamList } from '../types';
import { useRecipeContext } from '../context/RecipeContext';
import { useUserContext } from '../context/UserContext';
import RatingComments from '../components/RatingComments';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';
import { useRatingCache } from '../context/RatingCacheContext';
import { API_BASE_URL } from '../constants';

const RecipeDetailsScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { recipe } = route.params as { recipe: Recipe };
  const { toggleFavorite, isFavorite, getRecipeDetails, getRecipeAverageRating } = useRecipeContext();
  const { user } = useUserContext();
  const ratingCache = useRatingCache(); // 👈 Usar el hook de cache de valoraciones

  const { fromEdit } = route.params || {};

  const [portions, setPortions] = useState(1);
  const [recipeWithDetails, setRecipeWithDetails] = useState<Recipe>(recipe);
  const [loading, setLoading] = useState(false);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [ratingsLoaded, setRatingsLoaded] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [ratingsWithComments, setRatingsWithComments] = useState<any>(null);

  // Función para cargar datos de puntuación con comentarios
  const loadRatingsWithComments = useCallback(async () => {
    try {
      console.log('🔍 Cargando puntuaciones con comentarios...');
      const response = await fetch(`${API_BASE_URL}/recipes/${recipe.id}/puntuacion&incluirComentarios=1`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      
      if (json.status === 200 && json.data) {
        setRatingsWithComments(json.data);
        
        // Buscar la valoración del usuario actual
        if (user?.id && json.data.comentarios) {
          const userRatingData = json.data.comentarios.find(
            (comentario: any) => Number(comentario.idUsuario) === Number(user.id)
          );
          if (userRatingData) {
            setUserRating(userRatingData.puntuacion);
          }
        }
        
        console.log('✅ Puntuaciones cargadas para receta:', recipe.id);
      }
    } catch (error) {
      console.error('❌ Error al cargar puntuaciones:', error);
    }
  }, [recipe.id, user?.id]);

  // Cargar ingredientes y pasos al entrar en la pantalla
  useEffect(() => {
    let isMounted = true;
    
    const loadRecipeDetails = async () => {
      // Siempre mostrar loading inicial para evitar pantalla vacía
      if (isMounted) {
        setLoading(true);
      }
      
      try {
        console.log('� Cargando detalles completos de la receta:', recipe.id);
        
        // Siempre cargar datos completos de la API para garantizar que no estén vacíos
        const [completeRecipe] = await Promise.all([
          getRecipeDetails(recipe.id),
          loadRatingsWithComments()
        ]);
        
        if (completeRecipe && isMounted) {
          // Verificar que los datos estén completos
          const hasIngredients = completeRecipe.ingredients && completeRecipe.ingredients.length > 0;
          const hasSteps = completeRecipe.steps && completeRecipe.steps.length > 0;
          
          if (hasIngredients && hasSteps) {
            setRecipeWithDetails(completeRecipe);
            console.log('✅ Datos completos cargados:', { 
              ingredientes: completeRecipe.ingredients?.length || 0,
              pasos: completeRecipe.steps?.length || 0
            });
          } else {
            console.log('⚠️ Datos incompletos, usando datos originales');
            setRecipeWithDetails(recipe);
          }
        } else if (isMounted) {
          setRecipeWithDetails(recipe);
          console.log('⚠️ No se pudieron cargar datos completos, usando originales');
        }
        
        if (isMounted) {
          setDetailsLoaded(true);
        }
        
        // Cargar valoraciones después sin bloquear
        ratingCache.loadAndUpdateRating(recipe.id).catch(error => {
          console.error('❌ Error al cargar valoraciones:', error);
        });
        
      } catch (error) {
        console.error('❌ Error al cargar detalles:', error);
        if (isMounted) {
          setRecipeWithDetails(recipe);
          setDetailsLoaded(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRecipeDetails();
    
    return () => {
      isMounted = false;
    };
  }, [recipe.id]); // Solo depender del ID de la receta

  const adjustQuantity = useCallback((qty: number) => Math.round(qty * portions), [portions]);

  // Verificar si es una receta propia
  const isOwnRecipe = useMemo(() => {
    return user?.id && recipeWithDetails.userId && Number(user.id) === Number(recipeWithDetails.userId);
  }, [user?.id, recipeWithDetails.userId]);

  // Optimización: Memorizar datos de valoración
  const ratingData = useMemo(() => {
    if (ratingsWithComments) {
      return {
        promedio: ratingsWithComments.promedio,
        votos: ratingsWithComments.cantidadVotos
      };
    }
    return ratingCache.getRating(recipe.id);
  }, [ratingsWithComments, ratingCache, recipe.id]);
  
  const averageRating = ratingData?.promedio || 0;
  const voteCount = ratingData?.votos || 0;
  const isRatingLoaded = ratingData !== undefined;

  // Optimización: Memorizar callback de actualización
  const handleRatingUpdate = useCallback((newRating: number, newVoteCount: number) => {
    console.log('🔄 Actualizando valoración:', newRating, 'votos:', newVoteCount);
    ratingCache.updateRating(recipe.id, { promedio: newRating, votos: newVoteCount });
    
    // Recargar datos de puntuación después de actualizar
    loadRatingsWithComments();
  }, [ratingCache, recipe.id, loadRatingsWithComments]);

  // Optimización: Memorizar handlers de porciones
  const decreasePortions = useCallback(() => {
    setPortions(prev => Math.max(1, prev - 1));
  }, []);

  const increasePortions = useCallback(() => {
    setPortions(prev => prev + 1);
  }, []);

  // Optimización: Memorizar ingredientes renderizados
  const ingredientsList = useMemo(() => {
    if (!recipeWithDetails.ingredients?.length) {
      console.log('⚠️ No hay ingredientes disponibles para receta:', recipe.id);
      return <Text style={styles.ingredientText}>No hay ingredientes disponibles</Text>;
    }
    
    console.log('✅ Renderizando ingredientes:', recipeWithDetails.ingredients.length);
    return recipeWithDetails.ingredients.map((ing, index) => (
      <Text
        key={`ingredient-${ing.id || index}`}
        style={styles.ingredientText}
      >
        • {ing.name} ({adjustQuantity(Number(ing.quantity))} {ing.unit || 'g'})
      </Text>
    ));
  }, [recipeWithDetails.ingredients, adjustQuantity]);

  // Optimización: Memorizar pasos renderizados
  const stepsList = useMemo(() => {
    if (!recipeWithDetails.steps?.length) {
      console.log('⚠️ No hay pasos disponibles para receta:', recipe.id);
      return <Text style={styles.stepText}>No hay pasos disponibles</Text>;
    }
    
    console.log('✅ Renderizando pasos:', recipeWithDetails.steps.length);
    return recipeWithDetails.steps.map((step, index) => (
      <View key={`step-${step.order || index}`} style={styles.stepCard}>
        {step.image && (
          <Image
            source={step.image}
            style={styles.stepImg}
            resizeMode="cover"
            onError={() => console.log(`Error cargando imagen paso ${index + 1}`)}
          />
        )}
        <Text style={styles.stepText}>
          {index + 1}. {step.text || step.description}
        </Text>
      </View>
    ));
  }, [recipeWithDetails.steps]);

  // Optimización: Pre-cargar imagen principal
  const mainImageSource = useMemo(() => recipeWithDetails.image, [recipeWithDetails.image]);

  // Optimización: Memorizar callbacks de navegación
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleFavoritePress = useCallback(() => {
    toggleFavorite(recipeWithDetails);
  }, [toggleFavorite, recipeWithDetails]);

  const handleGoToMyRecipes = useCallback(() => {
    navigation.navigate('HomeTabs', { screen: 'Mis Recetas'});
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image 
        source={mainImageSource} 
        style={styles.image}
        resizeMode="cover"
        onError={() => console.log('Error cargando imagen principal')}
      />
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.favoriteButton} onPress={handleFavoritePress}>
        <Ionicons
          name={isFavorite(recipeWithDetails.id) ? 'heart' : 'heart-outline'}
          size={26}
          color={isFavorite(recipeWithDetails.id) ? 'red' : '#fff'}
        />
      </TouchableOpacity>

      <Text style={styles.title}>{recipeWithDetails.title}</Text>
      <Text style={styles.meta}>Por: {recipeWithDetails.author}</Text>
      <View style={styles.ratingContainer}>
        {isRatingLoaded ? (
          voteCount > 0 ? (
            <>
              <StarRating rating={averageRating} size={20} />
              <Text style={styles.ratingText}>
                ({averageRating.toFixed(1)} - {voteCount} {voteCount === 1 ? 'voto' : 'votos'})
              </Text>
            </>
          ) : (
            <Text style={styles.ratingText}>Sin valoraciones aún</Text>
          )
        ) : (
          <Text style={styles.ratingText}>Cargando valoración...</Text>
        )}
      </View>
      
      <Text style={styles.description}>
        {recipeWithDetails.description || 'No hay descripción disponible'}
      </Text>

      <Text style={styles.section}>Ingredientes</Text>
      {!detailsLoaded ? (
        <LoadingSpinner text="Cargando ingredientes..." />
      ) : (
        <>
          <View style={styles.portionsRow}>
            <TouchableOpacity onPress={decreasePortions}>
              <Ionicons name="remove-circle-outline" size={22} />
            </TouchableOpacity>
            <Text style={{ marginHorizontal: 10 }}>{portions} porciones</Text>
            <TouchableOpacity onPress={increasePortions}>
              <Ionicons name="add-circle-outline" size={22} />
            </TouchableOpacity>
          </View>
          {ingredientsList}
        </>
      )}

      <Text style={styles.section}>Pasos</Text>
      {!detailsLoaded ? (
        <LoadingSpinner text="Cargando pasos..." />
      ) : (
        stepsList
      )}

      {/* Valoración y Comentarios */}
      <Text style={styles.section}>Valoración y Comentarios</Text>
      <RatingComments 
        recipeId={recipe.id}
        currentRating={averageRating}
        onRatingUpdate={handleRatingUpdate}
        idAutor={recipeWithDetails.userId ?? -1}
        ratingsWithComments={ratingsWithComments}
        userRating={userRating}
        isOwnRecipe={!!isOwnRecipe}
      />

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
        onPress={handleGoToMyRecipes}
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
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
  userRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 6,
  },
  userRatingLabel: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
    fontWeight: '500',
  },
  userRatingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  ownRecipeContainer: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  ownRecipeText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default RecipeDetailsScreen;