import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Recipe } from '../types';
import { useRecipeContext } from '../context/RecipeContext';
import { useFilterContext } from '../context/FilterContext';
import { useSortContext } from '../context/SortContext';
import { useUserContext } from '../context/UserContext'; 
import { API_BASE_URL } from '../constants'; 

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeTabs'>;


const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { recipes, toggleFavorite, isFavorite } = useRecipeContext();
  const { filters } = useFilterContext();
  const { sortOrder } = useSortContext();
  const { user } = useUserContext(); // 👈 Obtener usuario del contexto
  
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [latestRecipes, setLatestRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[] | null>(null);

  const categoryIdMap: Record<string, string> = {
    Panaderia: '1',
    CocinaSalada: '2',
    Reposteria: '3',
    Bebidas: '4',
    Ensaladas: '5',
    Postres: '6',
    Sopas: '7',
    //Pescado: '8',
    PlatosPrincipales: '8',
    Aperitivos: '9',
    Salsas: '10',
  };

  const ingredientIdMap: Record<string, string> = {
    Pollo: '1',
    Azucar: '2',
    Manzanas: '3',
    Levadura: '4',
    Huevos: '5',
    Leche: '6',
    Mantequilla: '7',
    Sal: '8',
    Pimienta: '9',
    Aceitedeoliva: '10',
    Arroz: '11',
    Tomates: '12',
    Cebolla: '13',
    Ajo: '14',
    Queso: '15',
    Chcocolatenegro: '16',
    Vainilla: '17',
    Limon: '18',
    Zanahoria: '19',
    Papa: '20',
  };

  useEffect(() => {
    const fetchLatest = async () => {
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
            rating: 5,
          }));
          setLatestRecipes(adaptedData);
        } else {
          console.error('Error en backend:', json.message);
        }
      } catch (error) {
        console.error('Error fetching latest recipes:', error);
      }
    };

    fetchLatest();
  }, []);

  //Buesqueda de recetas por nombre
  // Esta función se ejecuta cada vez que el usuario escribe en el campo de búsqueda
  useEffect(() => {
  if (search.trim().length === 0) {
    setSearchResults([]);
    setIsSearching(false);
    return;
  }
  setIsSearching(true);

  const timeout = setTimeout(async () => {
    try {
      //const url = `${API_BASE_URL}/recipes/search?search=${encodeURIComponent(search)}`;
      const url = `${API_BASE_URL}/recipes/search&nombre=${encodeURIComponent(search)}&orden=nombre_asc`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const text = await response.text();
      //console.log('Respuesta búsqueda:', text);
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
          image: { uri: item.imagen },
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

}, [search]);

// Filtros de recetas por tipo, ingredientes incluidos y excluidos
// Esta función se ejecuta al cargar la pantalla y cada vez que cambian las recetas
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

  setIsSearching(true);

  // Convierte los nombres de ingredientes a IDs
  const incluirIds = (filters.include || [])
    .map((name) => ingredientIdMap[name])
    .filter(Boolean)
    .join(',');

  const excluirIds = (filters.exclude || [])
    .map((name) => ingredientIdMap[name])
    .filter(Boolean)
    .join(',');

  // Convierte la categoría a ID
  const tipoId = hasCategory
    ? categoryIdMap[filters.categories[0].replace(/\s/g, '')]
    : undefined;

  // Construye la URL según los filtros activos
  let url = `${API_BASE_URL}/recipes/search`;
  const params: string[] = [];
  if (tipoId) params.push(`tipo=${tipoId}`);
  if (incluirIds) params.push(`incluirIngredientes=${incluirIds}`);
  if (excluirIds) params.push(`excluirIngredientes=${excluirIds}`);
  params.push('orden=fecha_asc');
  url += '&' + params.join('&');

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
}, [filters.include, filters.exclude, filters.categories]);

  const applySort = (list: Recipe[]) => {
    return [...list].sort((a, b) => {
      if (sortOrder === 'Mas recientes') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortOrder === 'Mas antiguas') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sortOrder === 'Nombre A-Z') return a.title.localeCompare(b.title);
      if (sortOrder === 'Nombre Z-A') return b.title.localeCompare(a.title);
      return 0;
    });
  };

  const filtered = useMemo(() => {
    return recipes.filter((r: Recipe) => {
      const bySearch = r.title.toLowerCase().includes(search.toLowerCase());
      const byAuthor =
        !filters.user || r.author?.toLowerCase().includes(filters.user.toLowerCase());
      const byCategory =
        filters.categories.length === 0 || filters.categories.includes(r.category);
      const byInclude =
        filters.include.length === 0 ||
        filters.include.every((inc) =>
          r.ingredients?.some((i) =>
            i.name.toLowerCase().includes(inc.toLowerCase())
          )
        );
      const byExclude =
        filters.exclude.length === 0 ||
        filters.exclude.every((exc) =>
          !r.ingredients?.some((i) =>
            i.name.toLowerCase().includes(exc.toLowerCase())
          )
        );

      return bySearch && byAuthor && byCategory && byInclude && byExclude;
    });
  }, [recipes, filters, search]);

  const sorted = useMemo(() => applySort(filtered), [filtered, sortOrder]);

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => navigation.navigate('RecipeDetails', { recipe: item })}
    >
      <Image source={item.image} style={styles.recipeImage} />
      <View style={styles.recipeInfo}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.author}>Por: {item.author}</Text>
        <Text style={styles.rating}>{'⭐'.repeat(item.rating)}</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.searchHeader}>
          <Ionicons name="restaurant" size={24} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar recetas..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={styles.subheading}>Últimas Tres Recetas Cargadas: </Text>
        <FlatList
          data={latestRecipes}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => item.id ?? `latest-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.latestCard}
              onPress={() => navigation.navigate('RecipeDetails', { recipe: item })}
            >
              <Image source={item.image} style={styles.latestImage} />
              <View style={styles.latestTitle}>
                {(() => {
                  const words = item.title.split(' ');
                  const mid = Math.ceil(words.length / 2);
                  const line1 = words.slice(0, mid).join(' ');
                  const line2 = words.slice(mid).join(' ');

                  return (
                    <>
                      <Text style={styles.latestTitle}>{line1}</Text>
                      {line2.length > 0 && (
                        <Text style={styles.latestTitle}>{line2}</Text>
                      )}
                    </>
                  );
                })()}
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        />

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
        keyExtractor={(item) => item.id}
        renderItem={renderRecipe}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          isSearching ? <Text>Buscando...</Text> : <Text>No hay recetas.</Text>
        }
      />
      

      {/* <FlatList
        style={styles.list}
        data={search.trim().length > 0 ? searchResults : sorted}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipe}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          isSearching ? <Text>Buscando...</Text> : <Text>No hay recetas.</Text>
        }
      /> */}

      {/* <FlatList
        style={styles.list}
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipe}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
      /> */}

      {/* ⚠️ Mensaje de inicio de sesión (solo si no hay usuario) */}
      {!user && (
        <View style={styles.loginBanner}>
          <Text style={styles.loginText}>
            ¿Todavía no tienes cuenta? <Text style={styles.bold}>¡Unete!</Text>
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  },
  subheading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  latestCard: {
    marginRight: 12,
    alignItems: 'center',
  },
  latestImage: {
    width: 120,
    height: 100,
    borderRadius: 10,
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
  recipeImage: { width: 100, height: 100 },
  recipeInfo: { flex: 1, padding: 10 },
  title: { fontWeight: 'bold' },
  author: { fontSize: 12, color: '#555' },
  rating: { color: '#f9a825', fontSize: 14, marginTop: 5 },
  heartIcon: { padding: 10 },

  loginBanner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 13,
    color: '#333',
  },
  loginLink: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default HomeScreen;
