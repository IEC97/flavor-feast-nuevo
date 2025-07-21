// screens/RecipeDetailsScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { API_BASE_URL } from '../constants';

const RecipeDetailsScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { recipe } = route.params as { recipe: Recipe };
  const { toggleFavorite, isFavorite, getRecipeDetails, getRecipeAverageRating, favorites } = useRecipeContext();
  const { user } = useUserContext();
  const ratingCache = useRatingCache(); // 👈 Usar el hook de cache de valoraciones
  const { alertState, showLoginAlert, showPreventiveLimitAlert, showFavoritesLimitAlert, hideAlert, showAlert } = useCustomAlert();

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
        
        // NUEVA ESTRATEGIA: Hacer múltiples intentos si los datos vienen vacíos
        let completeRecipe = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!completeRecipe && attempts < maxAttempts && isMounted) {
          attempts++;
          console.log(`🔄 Intento ${attempts}/${maxAttempts} para cargar receta ${recipe.id}`);
          
          try {
            // ESTRATEGIA COMBINADA: Intentar contexto primero, luego fetch directo
            console.log(`🔧 Estrategia combinada para intento ${attempts}`);
            
            // Opción 1: Intentar con el contexto (método original)
            let recipeDetails = null;
            try {
              recipeDetails = await getRecipeDetails(recipe.id);
              console.log('📋 Contexto resultado:', recipeDetails ? 'Éxito' : 'Falló');
            } catch (contextError) {
              console.log('❌ Contexto falló:', contextError);
            }
            
            // Opción 2: Si el contexto falla, hacer fetch directo
            if (!recipeDetails || !recipeDetails.ingredients?.length || !recipeDetails.steps?.length) {
              console.log('🔧 Contexto insuficiente, haciendo fetch directo...');
              
              try {
                const [ingredientsRes, stepsRes, baseRes] = await Promise.all([
                  fetch(`${API_BASE_URL}/recipes/${recipe.id}/getRecipeIngredients`),
                  fetch(`${API_BASE_URL}/recipes/${recipe.id}/steps`),
                  fetch(`${API_BASE_URL}/recipes`)
                ]);
                
                const [ingredientsData, stepsData, baseData] = await Promise.all([
                  ingredientsRes.json(),
                  stepsRes.json(), 
                  baseRes.json()
                ]);
                
                // Buscar la receta base en la lista general
                let baseRecipe = recipe;
                if (baseData.status === 200 && baseData.data) {
                  const foundRecipe = baseData.data.find((r: any) => 
                    String(r.idReceta) === String(recipe.id)
                  );
                  if (foundRecipe) {
                    baseRecipe = {
                      ...recipe,
                      title: foundRecipe.nombre,
                      description: foundRecipe.descripcion,
                      author: foundRecipe.usuario,
                      image: { uri: foundRecipe.imagen }
                    };
                  }
                }
                
                if (ingredientsData.status === 200 && stepsData.status === 200) {
                  // MAPEAR PROPIEDADES DEL BACKEND AL FORMATO FRONTEND
                  const mappedIngredients = (ingredientsData.data?.ingredientes || []).map((ing: any) => ({
                    id: ing.id,
                    name: ing.nombre,          // nombre -> name
                    quantity: ing.cantidad,   // cantidad -> quantity
                    unit: ing.unidad         // unidad -> unit
                  }));
                  
                  const mappedSteps = (stepsData.data?.pasos || []).map((paso: any) => ({
                    order: paso.numero,              // numero -> order
                    text: paso.descripcion,          // descripcion -> text
                    description: paso.descripcion,   // También como description por compatibilidad
                    image: paso.multimedia ? { uri: paso.multimedia } : null
                  }));
                  
                  recipeDetails = {
                    ...baseRecipe,
                    ingredients: mappedIngredients,
                    steps: mappedSteps
                  };
                  
                  console.log('✅ Fetch directo exitoso con mapeo:', {
                    ingredientes: recipeDetails.ingredients.length,
                    pasos: recipeDetails.steps.length,
                    primerIngrediente: recipeDetails.ingredients[0],
                    primerPaso: recipeDetails.steps[0]
                  });
                }
              } catch (directError) {
                console.error('❌ Fetch directo falló:', directError);
              }
            }
            
            // También cargar ratings en paralelo
            await loadRatingsWithComments();
            
            if (recipeDetails && isMounted) {
              const hasIngredients = recipeDetails.ingredients && recipeDetails.ingredients.length > 0;
              const hasSteps = recipeDetails.steps && recipeDetails.steps.length > 0;
              
              if (hasIngredients && hasSteps) {
                completeRecipe = recipeDetails;
                console.log(`✅ Datos completos obtenidos en intento ${attempts}`);
                break;
              } else if (attempts === maxAttempts) {
                // En el último intento, usar lo que tenemos
                console.log('⚠️ Último intento - usando datos disponibles');
                completeRecipe = recipeDetails || recipe;
              } else {
                console.log(`⚠️ Intento ${attempts} incompleto, reintentando...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          } catch (attemptError) {
            console.error(`❌ Error en intento ${attempts}:`, attemptError);
            if (attempts === maxAttempts) {
              completeRecipe = recipe;
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        
        if (completeRecipe && isMounted) {
          setRecipeWithDetails(completeRecipe);
          console.log('✅ Receta final establecida:', { 
            ingredientes: completeRecipe.ingredients?.length || 0,
            pasos: completeRecipe.steps?.length || 0
          });
        } else if (isMounted) {
          console.log('⚠️ Usando datos originales como último recurso');
          setRecipeWithDetails(recipe);
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

  const adjustQuantity = useCallback((qty: number | string) => {
    const numQty = typeof qty === 'string' ? parseFloat(qty) : qty;
    const result = Math.round((numQty || 0) * portions * 100) / 100; // Redondear a 2 decimales
    return result % 1 === 0 ? result.toString() : result.toFixed(1); // Mostrar enteros sin .0
  }, [portions]);

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
    console.log('🔍 DEBUG ingredientsList - recipeWithDetails.ingredients:', recipeWithDetails.ingredients?.length);
    console.log('🔍 DEBUG ingredientsList - Primer ingrediente:', recipeWithDetails.ingredients?.[0]);
    
    if (!recipeWithDetails.ingredients?.length) {
      console.log('⚠️ No hay ingredientes disponibles para receta:', recipe.id);
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="nutrition-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No hay ingredientes disponibles</Text>
        </View>
      );
    }
    
    console.log('✅ Renderizando ingredientes:', recipeWithDetails.ingredients.length);
    return (
      <View style={styles.ingredientsContainer}>
        {recipeWithDetails.ingredients.map((ing, index) => (
          <View
            key={`ingredient-${ing.id || index}`}
            style={styles.ingredientCard}
          >
            <Text style={styles.ingredientName}>
              {ing.name}
            </Text>
            <View style={styles.quantityContainer}>
              <Text style={styles.ingredientQuantity}>
                {adjustQuantity(ing.quantity)}
              </Text>
              <Text style={styles.ingredientUnit}>
                {ing.unit || 'unidad'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  }, [recipeWithDetails.ingredients, adjustQuantity, detailsLoaded]);

  // Optimización: Memorizar pasos renderizados
  const stepsList = useMemo(() => {
    if (!recipeWithDetails.steps?.length) {
      console.log('⚠️ No hay pasos disponibles para receta:', recipe.id);
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="document-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No hay pasos disponibles</Text>
        </View>
      );
    }
    
    console.log('✅ Renderizando pasos:', recipeWithDetails.steps.length);
    return recipeWithDetails.steps.map((step, index) => (
      <View key={`step-${step.order || index}`} style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <Text style={styles.stepTitle}>Paso {index + 1}</Text>
        </View>
        
        <Text style={styles.stepDescription}>
          {step.text || step.description}
        </Text>
        
        {step.image && (
          <View style={styles.stepImageContainer}>
            <Image
              source={step.image}
              style={styles.stepImg}
              resizeMode="cover"
              onError={() => console.log(`Error cargando imagen paso ${index + 1}`)}
            />
          </View>
        )}
      </View>
    ));
  }, [recipeWithDetails.steps, detailsLoaded]);

  // Optimización: Pre-cargar imagen principal
  const mainImageSource = useMemo(() => recipeWithDetails.image, [recipeWithDetails.image]);

  // Optimización: Memorizar callbacks de navegación
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleFavoritePress = useCallback(async () => {
    // Verificar si el usuario está autenticado
    if (!user?.id) {
      showLoginAlert(() => navigation.navigate('Login'));
      return;
    }

    // Verificar límite de favoritos (máximo 10) - solo si no es favorito actualmente
    const isCurrentlyFavorite = isFavorite(recipeWithDetails.id);
    if (!isCurrentlyFavorite && favorites.length >= 10) {
      showPreventiveLimitAlert(() => navigation.navigate('HomeTabs', { screen: 'Favoritos' }));
      return;
    }

    // Proceder con toggle y manejar el resultado
    const result = await toggleFavorite(recipeWithDetails);
    
    if (!result.success && result.message) {
      // Verificar si es específicamente el error de límite de favoritos del backend
      if (result.message.includes('máximo de 10 recetas favoritas') || result.message.includes('Ha alcanzado el máximo')) {
        showFavoritesLimitAlert(() => navigation.navigate('HomeTabs', { screen: 'Favoritos' }));
      } else {
        // Otros errores - usar Alert nativo para estos
        Alert.alert('Error', result.message);
      }
    }
  }, [toggleFavorite, recipeWithDetails, user, isFavorite, favorites.length, navigation, showLoginAlert, showPreventiveLimitAlert, showFavoritesLimitAlert]);

  const handleGoToMyRecipes = useCallback(() => {
    navigation.navigate('HomeTabs', { screen: 'Mis Recetas'});
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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

      <View style={styles.mainContent}>
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
      </View>

      <Text style={styles.section}>Ingredientes</Text>
      {!detailsLoaded ? (
        <View style={{ paddingHorizontal: 20 }}>
          <LoadingSpinner text="Cargando ingredientes..." />
        </View>
      ) : (
        <>
          <View style={styles.portionsRow}>
            <TouchableOpacity 
              style={styles.portionsButton} 
              onPress={decreasePortions}
            >
              <Ionicons name="remove" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.portionsText}>{portions} porciones</Text>
            <TouchableOpacity 
              style={styles.portionsButton} 
              onPress={increasePortions}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {ingredientsList}
        </>
      )}

      <Text style={styles.section}>Pasos</Text>
      {!detailsLoaded ? (
        <View style={{ paddingHorizontal: 20 }}>
          <LoadingSpinner text="Cargando pasos..." />
        </View>
      ) : (
        stepsList
      )}

      {/* Valoración y Comentarios */}
      <Text style={styles.section}>Valoración y Comentarios</Text>
      <View style={{ paddingHorizontal: 20 }}>
        <RatingComments 
          recipeId={recipe.id}
          currentRating={averageRating}
          onRatingUpdate={handleRatingUpdate}
          idAutor={recipeWithDetails.userId ?? -1}
          ratingsWithComments={ratingsWithComments}
          userRating={userRating}
          isOwnRecipe={!!isOwnRecipe}
        />
      </View>

      {/* Botón solo si vienes de editar */}
      {fromEdit && (
        <TouchableOpacity
          style={{
            backgroundColor: '#3498db',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginVertical: 20,
            marginHorizontal: 20,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
          onPress={handleGoToMyRecipes}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
            Volver a Mis Recetas
          </Text>
        </TouchableOpacity>
      )}

      {/* CustomAlert para alertas estilizadas */}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        icon={alertState.icon}
        onClose={hideAlert}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    padding: 0, // Cambiar padding del contenedor
    paddingBottom: 20,
  },
  image: {
    width: '100%',
    height: 240, // Aumentar altura de imagen principal
    marginBottom: 0, // Sin margin porque agregamos contenido encima
  },
  backButton: {
    position: 'absolute',
    top: 40, // Ajustar posición
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)', // Mejor contraste
    borderRadius: 25,
    padding: 8,
    zIndex: 10,
  },
  favoriteButton: {
    position: 'absolute',
    top: 40, // Ajustar posición
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)', // Mejor contraste
    borderRadius: 25,
    padding: 8,
    zIndex: 10,
  },
  // Nuevo contenedor para info principal
  mainContent: {
    padding: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -25, // Overlap con la imagen
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  title: {
    fontSize: 28, // Título más grande
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 34,
  },
  meta: {
    color: '#7f8c8d',
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 20,
    lineHeight: 24,
    fontWeight: '400',
  },
  section: {
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 16,
    fontSize: 22,
    color: '#2c3e50',
    paddingHorizontal: 20,
  },
  // Mejorar contenedor de porciones
  portionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  portionsText: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  portionsButton: {
    backgroundColor: '#34495e',
    borderRadius: 20,
    padding: 8,
  },
  // Estilos para ingredientes mejorados
  ingredientsContainer: {
    paddingHorizontal: 20,
  },
  ingredientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    marginHorizontal: 0,
  },
  ingredientName: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 80,
    justifyContent: 'flex-end',
  },
  ingredientQuantity: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
    textAlign: 'right',
  },
  ingredientUnit: {
    fontSize: 14,
    color: '#95a5a6',
    fontWeight: '500',
    marginLeft: 4,
    textAlign: 'left',
  },
  ingredientText: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
    paddingLeft: 20,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 20,
    lineHeight: 22,
  },
  // Nuevos estilos para pasos mejorados
  stepCard: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34495e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  stepDescription: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
    padding: 16,
    paddingTop: 16,
  },
  stepImageContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  stepImg: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  // Estados vacíos mejorados
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 12,
    textAlign: 'center',
  },
  // Resto de estilos existentes pero mejorados
  rating: {
    fontSize: 16,
    color: '#f39c12',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
  },
  userRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#e8f4f8',
    padding: 12,
    borderRadius: 10,
  },
  userRatingLabel: {
    fontSize: 14,
    color: '#2c3e50',
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
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
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