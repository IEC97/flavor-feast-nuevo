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
import LoadingSpinner from '../components/LoadingSpinner';
import { useRatingCache } from '../context/RatingCacheContext'; 

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeTabs'>;


const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { recipes, toggleFavorite, isFavorite } = useRecipeContext();
  const { filters } = useFilterContext();
  const { sortOrder } = useSortContext();
  const { user } = useUserContext();
  const ratingCache = useRatingCache();
  // Estados optimizados
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [latestRecipes, setLatestRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
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

  // Función para crear mapa de categorías optimizado
  const createCategoryMap = (categories: any[]): Record<string, string> => {
    const map: Record<string, string> = {};
    categories.forEach((cat) => {
      const normalizedName = cat.nombre
        .replace(/\s+/g, '')
        .replace(/ía/g, 'ia')
        .replace(/ó/g, 'o');
      map[normalizedName] = String(cat.idTipo);
    });
    return map;
  };

  // Función para crear mapa de ingredientes optimizado
  const createIngredientMap = (ingredients: any[]): Record<string, string> => {
    const map: Record<string, string> = {};
    ingredients.forEach((ing) => {
      const normalizedName = ing.nombre
        .replace(/\s+/g, '')
        .replace(/ú/g, 'u')
        .replace(/ó/g, 'o')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      map[normalizedName] = String(ing.idIngrediente);
    });
    return map;
  };

  // Función optimizada para cargar mapas de IDs
  const loadIdMaps = async () => {
    if (mapsLoaded) return;
    
    try {
      const [catRes, ingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tipos`),
        fetch(`${API_BASE_URL}/ingredients`)
      ]);

      const [catData, ingData] = await Promise.all([
        catRes.json(),
        ingRes.json()
      ]);

      if (catData.status === 200 && catData.data) {
        setCategoryIdMap(createCategoryMap(catData.data));
      }

      if (ingData.status === 200 && ingData.data) {
        setIngredientIdMap(createIngredientMap(ingData.data));
      }

      setMapsLoaded(true);
    } catch (error) {
      console.error('Error cargando mapas:', error);
    }
  };

  // Función optimizada para obtener las 3 últimas recetas
  const fetchLatestThree = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes/latest`);
      const json = await response.json();
      
      if (json.status === 200 && json.data) {
        const adaptedData = json.data.map((item: any) => ({
          id: String(item.idReceta),
          title: item.nombre,
          image: { uri: item.imagen },
          author: item.usuario,
          createdAt: new Date(item.fechaPublicacion).getTime(),
          rating: 0,
          description: item.descripcion || '',
        }));
        setLatestRecipes(adaptedData);
      } else {
        setLatestRecipes([]);
      }
    } catch (error) {
      console.error('Error fetching latest recipes:', error);
      setLatestRecipes([]);
    }
  };

  // Función optimizada para obtener todas las recetas
  const fetchAllRecipes = async () => {
    try {
      const sortParam = getSortParameter(sortOrder);
      const response = await fetch(`${API_BASE_URL}/recipes&orden=${sortParam}`);
      const json = await response.json();
      
      if (json.status === 200 && json.data) {
        const adaptedData = json.data.map((item: any) => ({
          id: String(item.idReceta),
          title: item.nombre,
          image: { uri: item.imagen },
          author: item.usuario,
          createdAt: new Date(item.fechaPublicacion).getTime(),
          rating: 0,
          description: item.descripcion || '',
        }));
        setAllRecipes(adaptedData);
      }
    } catch (error) {
      console.error('Error fetching all recipes:', error);
    }
  };

  // Función optimizada para actualizar página
  const onRefresh = async () => {
    setRefreshing(true);
    setIsRefreshing(true);
    
    try {
      await Promise.all([
        loadIdMaps(),
        fetchLatestThree(),
        fetchAllRecipes()
      ]);
      
      setInitialLoadComplete(true);
      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
      setIsRefreshing(false);
    }
  };

  // Actualizar al entrar a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      onRefresh();
    }, [])
  );

  // Recargar recetas cuando cambie el ordenamiento
  useEffect(() => {
    const timeSinceRefresh = Date.now() - lastRefreshTime;
    
    if (initialLoadComplete && 
        !isRefreshing &&
        timeSinceRefresh > 1000 &&
        search.trim().length === 0 && 
        (!filters.include?.length && !filters.exclude?.length && !filters.categories?.length)) {
      fetchAllRecipes();
    }
  }, [sortOrder, initialLoadComplete, isRefreshing, lastRefreshTime]);

  // Búsqueda optimizada de recetas
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
        const response = await fetch(
          `${API_BASE_URL}/recipes/search&nombre=${encodeURIComponent(search)}&orden=${sortParam}`
        );
        
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
            description: item.descripcion || '',
          }));
          setSearchResults(adaptedData);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [search, sortOrder]);

  // Filtros optimizados de recetas
  useEffect(() => {
    const hasInclude = filters.include && filters.include.length > 0;
    const hasExclude = filters.exclude && filters.exclude.length > 0;
    const hasCategory = filters.categories && filters.categories.length > 0;

    if (!hasInclude && !hasExclude && !hasCategory) {
      setFilteredRecipes(null);
      return;
    }

    if (!mapsLoaded) return;

    setIsSearching(true);

    // Mapear nombres a IDs
    const incluirIds = (filters.include || [])
      .map((name) => {
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
        const normalizedName = name
          .replace(/\s+/g, '')
          .replace(/ú/g, 'u')
          .replace(/ó/g, 'o')
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return ingredientIdMap[normalizedName];
      })
      .filter(Boolean)
      .join(',');

    const tipoId = hasCategory
      ? (() => {
          const normalizedCategory = filters.categories[0]
            .replace(/\s+/g, '')
            .replace(/ía/g, 'ia')
            .replace(/ó/g, 'o');
          return categoryIdMap[normalizedCategory];
        })()
      : undefined;

    // Construir URL
    const params: string[] = [];
    if (tipoId) params.push(`tipo=${tipoId}`);
    if (incluirIds) params.push(`incluirIngredientes=${incluirIds}`);
    if (excluirIds) params.push(`excluirIngredientes=${excluirIds}`);
    params.push(`orden=${getSortParameter(sortOrder)}`);
    
    const url = `${API_BASE_URL}/recipes/search&${params.join('&')}`;

    let cancelled = false;
    const fetchFiltered = async () => {
      try {
        const response = await fetch(url);
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
            description: item.descripcion || '',
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
    return () => { cancelled = true; };
  }, [filters.include, filters.exclude, filters.categories, mapsLoaded, categoryIdMap, ingredientIdMap, sortOrder]);

  // Aplicar ordenamiento optimizado
  const applySort = (list: Recipe[]) => {
    return [...list].sort((a, b) => {
      switch (sortOrder) {
        case 'Mas recientes': return (b.createdAt || 0) - (a.createdAt || 0);
        case 'Mas antiguas': return (a.createdAt || 0) - (b.createdAt || 0);
        case 'Nombre A-Z': return a.title.localeCompare(b.title);
        case 'Nombre Z-A': return b.title.localeCompare(a.title);
        default: return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });
  };

  // Filtrado optimizado
  const filtered = useMemo(() => {
    if (search.trim().length > 0 || filteredRecipes !== null) {
      return [];
    }
    
    return allRecipes.filter((r: Recipe) => {
      return !filters.user || r.author?.toLowerCase().includes(filters.user.toLowerCase());
    });
  }, [allRecipes, filters, search, filteredRecipes]);

  // Ordenamiento optimizado
  const sorted = useMemo(() => {
    if (search.trim().length === 0 && filteredRecipes === null) {
      return applySort(filtered);
    }
    return filtered;
  }, [filtered, sortOrder]);

  // Componente optimizado para renderizar recetas
  const renderRecipe = ({ item }: { item: Recipe }) => {
    const ratingData = ratingCache.getRating(item.id);
    const averageRating = ratingData?.promedio || 0;
    const voteCount = ratingData?.votos || 0;
    const isRatingLoaded = ratingData !== undefined;
    
    const renderRatingSection = () => {
      if (!isRatingLoaded) return <Text style={styles.ratingLoading}>Cargando valoración...</Text>;
      if (voteCount === 0) return <Text style={styles.noRating}>Sin valoraciones aún</Text>;
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

        <Text style={styles.subheading}>Últimas Tres Recetas:</Text>
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
                      {line2.length > 0 && <Text style={styles.latestTitle}>{line2}</Text>}
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
        data={search.trim().length > 0 ? searchResults : filteredRecipes !== null ? filteredRecipes : sorted}
        keyExtractor={(item, index) => `home-recipe-${item.id}-${index}`}
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
        ListEmptyComponent={isSearching ? <LoadingSpinner text="Buscando..." /> : <Text>No hay recetas.</Text>}
        contentInsetAdjustmentBehavior="automatic"
      />

      {/* Banner de inicio de sesión */}
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
  headerContainer: { paddingBottom: 10, backgroundColor: '#fff' },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, paddingVertical: 6, color: '#000' },
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
  latestCard: { flex: 1, maxWidth: '30%', alignItems: 'center', marginHorizontal: 4 },
  latestImage: { width: '100%', aspectRatio: 1, borderRadius: 10, maxWidth: 100 },
  latestTitleContainer: { alignItems: 'center', marginTop: 4 },
  latestTitle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', lineHeight: 16 },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  orderText: { fontSize: 14, color: '#555' },
  bold: { fontWeight: 'bold', color: '#000' },
  list: { flex: 1 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 100 },
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
  ratingLoading: { fontSize: 12, color: '#999', marginTop: 5, fontStyle: 'italic' },
  noRating: { fontSize: 12, color: '#bbb', marginTop: 5, fontStyle: 'italic' },
  heartIcon: { padding: 10 },
  loginBannerFixed: {
    position: 'absolute',
    bottom: 80,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginTextFixed: { fontSize: 14, color: '#FFFFFF', fontWeight: 'normal' },
  boldFixed: { fontWeight: 'bold', color: '#FFFFFF' },
  loginLinkFixed: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default HomeScreen;
