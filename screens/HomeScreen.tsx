import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Recipe } from '../types';
import { useRecipeContext } from '../context/RecipeContext';
import { useFilterContext } from '../context/FilterContext';
import { useSortContext } from '../context/SortContext';
import { useUserContext } from '../context/UserContext'; 
import { API_BASE_URL } from '../constants'; 
import StarRating from '../components/StarRating'; 
import { useRatingCache } from '../context/RatingCacheContext'; 

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeTabs'>;


const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { recipes, toggleFavorite, isFavorite } = useRecipeContext();
  const { filters } = useFilterContext();
  const { sortOrder } = useSortContext();
  const { user } = useUserContext(); // 👈 Obtener usuario del contexto
  const ratingCache = useRatingCache(); // 👈 Usar el hook de cache de valoraciones
  
  // console.log('🔍 HomeScreen render - current sortOrder:', sortOrder); // Removido - muy verboso
  
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [latestRecipes, setLatestRecipes] = useState<Recipe[]>([]); // Para las 3 últimas recetas
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]); // Para la lista principal con paginación
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingsLoaded, setRatingsLoaded] = useState(false); // Estado para force re-render
  const [forceUpdate, setForceUpdate] = useState(0); // Estado para forzar actualizaciones
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const PAGE_SIZE = 6; // Tamaño de página para paginación real

  // Estados para mapas dinámicos
  const [categoryIdMap, setCategoryIdMap] = useState<Record<string, string>>({});
  const [ingredientIdMap, setIngredientIdMap] = useState<Record<string, string>>({});
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Función para convertir opciones de ordenamiento a parámetros del backend
  const getSortParameter = (sortOrder: string): string => {
    switch (sortOrder) {
      case 'Mas recientes':
        return 'fecha_desc';
      case 'Mas antiguas':
        return 'fecha_asc';
      case 'Nombre A-Z':
        return 'nombre_asc';
      case 'Nombre Z-A':
        return 'nombre_desc';
      default:
        return 'fecha_desc'; // Por defecto
    }
  };

  // Función para crear mapa de categorías dinámico
  const createCategoryMap = (categories: any[]): Record<string, string> => {
    const map: Record<string, string> = {};
    categories.forEach((cat) => {
      // Normalizar nombre para que coincida con el formato usado en filtros
      const normalizedName = cat.nombre
        .replace(/\s+/g, '') // Quitar espacios
        .replace(/ía/g, 'ia') // Panadería -> Panaderia
        .replace(/ó/g, 'o'); // Repostería -> Reposteria
      
      map[normalizedName] = String(cat.idTipo);
    });
    return map;
  };

  // Función para crear mapa de ingredientes dinámico
  const createIngredientMap = (ingredients: any[]): Record<string, string> => {
    const map: Record<string, string> = {};
    ingredients.forEach((ing) => {
      // Normalizar nombre para que coincida con el formato usado en filtros
      const normalizedName = ing.nombre
        .replace(/\s+/g, '') // Quitar espacios: "Aceite de oliva" -> "Aceitedoliva"
        .replace(/ú/g, 'u') // Azúcar -> Azucar
        .replace(/ó/g, 'o') // Limón -> Limon
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Quitar acentos
      
      map[normalizedName] = String(ing.idIngrediente);
    });
    return map;
  };

  // Función para cargar mapas de IDs dinámicamente
  const loadIdMaps = async () => {
    if (mapsLoaded) return; // Solo cargar una vez
    
    try {
      // Cargar mapas de categorías e ingredientes
      
      const [catRes, ingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tipos`),
        fetch(`${API_BASE_URL}/ingredients`)
      ]);

      const [catData, ingData] = await Promise.all([
        catRes.json(),
        ingRes.json()
      ]);

      if (catData.status === 200 && catData.data) {
        const catMap = createCategoryMap(catData.data);
        setCategoryIdMap(catMap);
        // console.log('✅ Mapa de categorías cargado:', catMap); // Removido - muy verboso
      }

      if (ingData.status === 200 && ingData.data) {
        const ingMap = createIngredientMap(ingData.data);
        setIngredientIdMap(ingMap);
        // console.log('✅ Mapa de ingredientes cargado:', Object.keys(ingMap).length, 'ingredientes'); // Removido - muy verboso
      }

      setMapsLoaded(true);
    } catch (error) {
      console.error('❌ Error al cargar mapas de IDs:', error);
    }
  };

  // Función para obtener las 3 últimas recetas del endpoint específico
  const fetchLatestThree = async () => {
    try {
      const url = `${API_BASE_URL}/recipes/latest`;
      
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.status === 200 && json.data) {
        const adaptedData = json.data.map((item: any) => ({
          id: String(item.idReceta),
          title: item.nombre,
          image: { uri: item.imagen },
          author: item.usuario,
          createdAt: new Date(item.fechaPublicacion).getTime(),
          rating: 0, // No usar rating hardcodeado
        }));
        
        setLatestRecipes(adaptedData);
        
        // Cargar valoraciones para las últimas 3 recetas
        if (adaptedData.length > 0) {
          const recipeIds = adaptedData.map((recipe: Recipe) => recipe.id);
          await ratingCache.loadMultipleRatings(recipeIds);
        }
      } else {
        console.error('Error al cargar últimas recetas:', json.message);
        setLatestRecipes([]);
      }
    } catch (error) {
      console.error('Error fetching latest 3 recipes:', error);
      setLatestRecipes([]);
    }
  };

  // Función para obtener recetas con paginación real del backend (para la lista principal)
  const fetchAllRecipes = async (page: number = 1, append: boolean = false) => {
    try {
      // Calcular offset basado en la página actual
      const offset = (page - 1) * PAGE_SIZE;
      // Incluir parámetro de ordenamiento
      const sortParam = getSortParameter(sortOrder);
      const url = `${API_BASE_URL}/recipes&limit=${PAGE_SIZE}&offset=${offset}&orden=${sortParam}`;
      
      // console.log(`📄 Fetching page ${page}, offset: ${offset}, append: ${append}, sort: ${sortParam}`); // Removido - muy verboso
      
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.status === 200 && json.data) {
        const adaptedData = json.data.map((item: any) => ({
          id: String(item.idReceta),
          title: item.nombre,
          image: { uri: item.imagen },
          author: item.usuario,
          createdAt: new Date(item.fechaPublicacion).getTime(),
          rating: 0,
        }));
        
        // console.log(`✅ Received ${adaptedData.length} recipes for page ${page}`); // Removido - muy verboso
        // Mapa de categorías cargado
        
        if (append) {
          setAllRecipes(prev => {
            const newRecipes = [...prev, ...adaptedData];
            // Total recipes after append
            return newRecipes;
          });
        } else {
          // Replacing recipes with new recipes
          setAllRecipes(adaptedData);
        }
        
        // Actualizar estado de paginación basado en la cantidad recibida
        setHasMoreData(adaptedData.length === PAGE_SIZE);
        
        // Cargar valoraciones para las nuevas recetas
        if (adaptedData.length > 0) {
          const recipeIds = adaptedData.map((recipe: Recipe) => recipe.id);
          await ratingCache.loadMultipleRatings(recipeIds);
          setRatingsLoaded(prev => !prev);
        }
      } else {
        console.error('Error en backend:', json.message);
        setHasMoreData(false);
      }
    } catch (error) {
      console.error('Error fetching all recipes:', error);
      setHasMoreData(false);
    }
  };

  // Función para cargar más recetas (infinite scroll)
  const loadMoreRecipes = async () => {
    if (loadingMore || !hasMoreData) {
      // Skipping loadMore: already loading or no more data
      return;
    }
    
    const nextPage = currentPage + 1;
    // Loading next page
    
    setLoadingMore(true);
    await fetchAllRecipes(nextPage, true); // append = true
    setCurrentPage(nextPage);
    setLoadingMore(false);
    
    // Finished loading page
  };

  // Función para resetear completamente el estado
  const resetPagination = () => {
    // Resetting pagination state
    setCurrentPage(1);
    setLoadingMore(false);
    setHasMoreData(true);
    setAllRecipes([]);
  };

  // Actualizar página
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Starting refresh...
      // Resetear completamente el estado de paginación
      resetPagination();
      ratingCache.clearCache(); // Limpiar cache de valoraciones
      
      // Cargar mapas de IDs y recetas en paralelo
      await Promise.all([
        loadIdMaps(), // Cargar mapas dinámicos
        fetchLatestThree(),
        fetchAllRecipes(1, false) // Cargar primera página de la lista principal
      ]);
      // Refresh completed
    } catch (error) {
      console.error('❌ Error al actualizar:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Actualizar al entrar a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      onRefresh();
      setForceUpdate(prev => prev + 1);
    }, [])
  );

  // Recargar recetas cuando cambie el ordenamiento
  useEffect(() => {
    // Usar setTimeout para asegurar que las variables de estado estén actualizadas
    setTimeout(() => {
      // Solo recargar si no estamos en una búsqueda activa ni con filtros aplicados
      if (search.trim().length === 0 && (!filters.include?.length && !filters.exclude?.length && !filters.categories?.length)) {
        resetPagination();
        fetchAllRecipes(1, false);
      }
    }, 0);
  }, [sortOrder]);

  // Escuchar cambios en el cache de valoraciones para re-render automático
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [ratingCache.updateCounter]);

  // Force update cuando cambian las valoraciones cargadas
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [ratingsLoaded]);

  // Eliminamos el useEffect duplicado que causaba el loop

  // Búsqueda de recetas por nombre
  useEffect(() => {
  if (search.trim().length === 0) {
    setSearchResults([]);
    setIsSearching(false);
    return;
  }
  setIsSearching(true);

  const timeout = setTimeout(async () => {
    try {
      const sortParam = getSortParameter(sortOrder);
      const url = `${API_BASE_URL}/recipes/search&nombre=${encodeURIComponent(search)}&orden=${sortParam}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      if (json.status === 200 && json.data) {
        const adaptedData = json.data.map((item: any) => ({
          id: String(item.idReceta),
          title: item.nombre,
          image: { uri: item.imagenMiniatura || item.imagen },
          author: item.usuario,
          createdAt: new Date(item.fechaPublicacion).getTime(),
          rating: 5,
        }));
        setSearchResults(adaptedData);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      setSearchResults([]);
    }
    setIsSearching(false);
  }, 500); // debounce

  return () => clearTimeout(timeout);

}, [search, sortOrder]);

// Filtros de recetas por tipo, ingredientes incluidos y excluidos
useEffect(() => {
  // Detecta si hay filtros activos
  const hasInclude = filters.include && filters.include.length > 0;
  const hasExclude = filters.exclude && filters.exclude.length > 0;
  const hasCategory = filters.categories && filters.categories.length > 0;

  // Si no hay ningún filtro, muestra todas las recetas
  if (!hasInclude && !hasExclude && !hasCategory) {
    setFilteredRecipes(null);
    return;
  }

  // Esperar a que los mapas estén cargados antes de filtrar
  if (!mapsLoaded) {
    // Esperar a que los mapas estén cargados antes de filtrar
    return;
  }

  setIsSearching(true);

  // Convierte los nombres de ingredientes a IDs usando el mapa dinámico
  const incluirIds = (filters.include || [])
    .map((name) => {
      // Normalizar nombre igual que en createIngredientMap
      const normalizedName = name
        .replace(/\s+/g, '')
        .replace(/ú/g, 'u')
        .replace(/ó/g, 'o')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return ingredientIdMap[normalizedName];
    })
    .filter(Boolean)
    .join(',');

  const excluirIds = (filters.exclude || [])
    .map((name) => {
      // Normalizar nombre igual que en createIngredientMap
      const normalizedName = name
        .replace(/\s+/g, '')
        .replace(/ú/g, 'u')
        .replace(/ó/g, 'o')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return ingredientIdMap[normalizedName];
    })
    .filter(Boolean)
    .join(',');

  // Convierte la categoría a ID usando el mapa dinámico
  const tipoId = hasCategory
    ? (() => {
        const normalizedCategory = filters.categories[0]
          .replace(/\s+/g, '') // Quitar espacios
          .replace(/ía/g, 'ia') // Panadería -> Panaderia
          .replace(/ó/g, 'o'); // Repostería -> Reposteria
        return categoryIdMap[normalizedCategory];
      })()
    : undefined;

  // Construye la URL según los filtros activos
  let url = `${API_BASE_URL}/recipes/search`;
  const params: string[] = [];
  if (tipoId) params.push(`tipo=${tipoId}`);
  if (incluirIds) params.push(`incluirIngredientes=${incluirIds}`);
  if (excluirIds) params.push(`excluirIngredientes=${excluirIds}`);
  const sortParam = getSortParameter(sortOrder);
  params.push(`orden=${sortParam}`);
  url += '&' + params.join('&');

  // Aplicar filtros al backend

  let cancelled = false;

  const fetchFiltered = async () => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        if (!cancelled) setFilteredRecipes([]);
        setIsSearching(false);
        return;
      }
      if (json.status === 200 && json.data) {
        const adaptedData = json.data.map((item: any) => ({
          id: String(item.idReceta),
          title: item.nombre,
          image: { uri: item.imagenMiniatura || item.imagen },
          author: item.usuario,
          createdAt: new Date(item.fecha).getTime(),
          rating: 5,
        }));
        if (!cancelled) setFilteredRecipes(adaptedData);
      } else {
        if (!cancelled) setFilteredRecipes([]);
      }
    } catch (error) {
      if (!cancelled) setFilteredRecipes([]);
    }
    setIsSearching(false);
  };

  fetchFiltered();

  return () => {
    cancelled = true;
  };
}, [filters.include, filters.exclude, filters.categories, mapsLoaded, categoryIdMap, ingredientIdMap, sortOrder]);

  const applySort = (list: Recipe[]) => {
    return [...list].sort((a, b) => {
      if (sortOrder === 'Mas recientes') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortOrder === 'Mas antiguas') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sortOrder === 'Nombre A-Z') return a.title.localeCompare(b.title);
      if (sortOrder === 'Nombre Z-A') return b.title.localeCompare(a.title);
      // Por defecto, ordenar por más recientes (consistente con el backend)
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  };

  const filtered = useMemo(() => {
    // Si hay búsqueda activa, no filtrar allRecipes, usar searchResults
    if (search.trim().length > 0) {
      return []; // No filtrar allRecipes cuando hay búsqueda
    }
    
    // Para filtros aplicados, usar filteredRecipes, no allRecipes
    if (filteredRecipes !== null) {
      return []; // No filtrar allRecipes cuando hay filtros aplicados
    }
    
    // Solo aplicar filtros locales cuando usamos allRecipes (sin búsqueda ni filtros de backend)
    return allRecipes.filter((r: Recipe) => {
      const byAuthor =
        !filters.user || r.author?.toLowerCase().includes(filters.user.toLowerCase());
      
      return byAuthor;
    });
  }, [allRecipes, filters, search, searchResults, filteredRecipes]);

  const sorted = useMemo(() => {
    // Los datos del backend ya vienen ordenados, solo aplicar applySort como fallback para filtros locales
    // que no tienen búsqueda ni filtros de backend activos
    if (search.trim().length === 0 && filteredRecipes === null) {
      return applySort(filtered);
    }
    return filtered;
  }, [filtered, sortOrder]);

  const renderRecipe = ({ item }: { item: Recipe }) => {
    const ratingData = ratingCache.getRating(item.id);
    const averageRating = ratingData?.promedio || 0;
    const voteCount = ratingData?.votos || 0;
    const isRatingLoaded = ratingData !== undefined;
    
    const renderRatingSection = () => {
      if (!isRatingLoaded) {
        return <Text style={styles.ratingLoading}>Cargando valoración...</Text>;
      }
      
      if (voteCount === 0) {
        return <Text style={styles.noRating}>Sin valoraciones aún</Text>;
      }
      
      return <StarRating rating={averageRating} size={14} />;
    };
    
    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => navigation.navigate('RecipeDetails', { recipe: item })}
      >
        <Image source={item.image} style={styles.recipeImage} />
        <View style={styles.recipeInfo}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.author}>Por: {item.author}</Text>
          {renderRatingSection()}
        </View>
        <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.heartIcon}>
          <Ionicons
            name={isFavorite(item.id) ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite(item.id) ? 'red' : 'gray'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.headerContainer}>
        <View style={styles.searchHeader}>
          <Ionicons name="restaurant" size={24} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar recetas..."
            placeholderTextColor="#000"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={styles.subheading}>Últimas Tres Recetas: </Text>
        <View style={styles.latestRecipesContainer}>
          {latestRecipes.slice(0, 3).map((item, index) => (
            <TouchableOpacity
              key={item.id ?? `latest-${index}`}
              style={styles.latestCard}
              onPress={() => navigation.navigate('RecipeDetails', { recipe: item })}
            >
              <Image source={item.image} style={styles.latestImage} />
              <View style={styles.latestTitleContainer}>
                {(() => {
                  const words = item.title.split(' ');
                  const mid = Math.ceil(words.length / 2);
                  const line1 = words.slice(0, mid).join(' ');
                  const line2 = words.slice(mid).join(' ');

                  return (
                    <View>
                      <Text style={styles.latestTitle}>{line1}</Text>
                      {line2.length > 0 && (
                        <Text style={styles.latestTitle}>{line2}</Text>
                      )}
                    </View>
                  );
                })()}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filtersHeader}>
          <TouchableOpacity onPress={() => navigation.navigate('SortOptions')}>
            <Text style={styles.orderText}>
              Ordenar por <Text style={styles.bold}>{sortOrder}</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('FilterScreen')}>
            <Ionicons name="filter" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        style={styles.list}
        data={
          search.trim().length > 0
            ? searchResults
            : filteredRecipes !== null
            ? filteredRecipes
            : sorted
        }
        keyExtractor={(item, index) => `home-recipe-${item.id}-${index}-${forceUpdate}`}
        renderItem={renderRecipe}
        contentContainerStyle={{ ...styles.listContainer, paddingBottom: 100 }}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#23294c']}
            tintColor="#23294c"
          />
        }
        ListEmptyComponent={
          isSearching ? <Text>Buscando...</Text> : <Text>No hay recetas.</Text>
        }
        ListFooterComponent={() => {
          // Solo mostrar loading cuando estamos en la lista principal
          if (search.trim().length === 0 && filteredRecipes === null) {
            if (loadingMore) {
              return (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text>Cargando más recetas...</Text>
                </View>
              );
            }
            if (!hasMoreData && allRecipes.length > 0) {
              return (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#666' }}>No hay más recetas</Text>
                </View>
              );
            }
          }
          return null;
        }}
        onEndReached={(info) => {
          // Solo cargar más si estamos en la lista principal (sin búsqueda ni filtros)
          if (search.trim().length === 0 && 
              filteredRecipes === null && 
              !loadingMore && 
              hasMoreData &&
              !refreshing) {
            loadMoreRecipes();
          }
        }}
        onEndReachedThreshold={0.5}
        // Agregar espacio inferior para evitar superposición con TabBar
        contentInsetAdjustmentBehavior="automatic"
      />

      {/* ⚠️ Banner de inicio de sesión fijo (solo si no hay usuario) */}
      {!user && (
        <View style={styles.loginBannerFixed}>
          <Text style={styles.loginTextFixed}>
            ¿Todavía no tienes cuenta? <Text style={styles.boldFixed}>¡Únete!</Text>
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkFixed}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: {
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    color: '#000', // Texto negro
  },
  subheading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  latestRecipesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  latestCard: {
    flex: 1,
    maxWidth: '30%',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  latestImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    maxWidth: 100,
  },
  latestTitleContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  latestTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  orderText: {
    fontSize: 14,
    color: '#555',
  },
  bold: {
    fontWeight: 'bold',
    color: '#000',
  },
  list: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Espacio extra para evitar superposición con TabBar
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
  recipeImage: { width: 100, height: 100 },
  recipeInfo: { flex: 1, padding: 10 },
  title: { fontWeight: 'bold' },
  author: { fontSize: 12, color: '#555' },
  rating: { color: '#f9a825', fontSize: 14, marginTop: 5 },
  ratingLoading: { fontSize: 12, color: '#999', marginTop: 5, fontStyle: 'italic' },
  noRating: { fontSize: 12, color: '#bbb', marginTop: 5, fontStyle: 'italic' },
  heartIcon: { padding: 10 },

  loginBanner: {
    backgroundColor: '#13162e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loginLink: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },

  // Estilos para el banner fijo
  loginBannerFixed: {
    position: 'absolute',
    bottom: 80, // Altura por encima de la TabBar
    left: 0,
    right: 0,
    backgroundColor: '#13162e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginTextFixed: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'normal',
  },
  boldFixed: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loginLinkFixed: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default HomeScreen;
