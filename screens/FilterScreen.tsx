// Ruta: screens/FilterScreen.tsx

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFilterContext } from '../context/FilterContext';
import { API_BASE_URL } from '../constants';

const FilterScreen = () => {
  const navigation = useNavigation();
  const { filters, setFilters } = useFilterContext();

  const [userSearch, setUserSearch] = useState('');
  const [include, setInclude] = useState<string[]>([]);
  const [exclude, setExclude] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const hasLoadedInitialState = useRef(false);
  
  // Optimización: Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(ingredientSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [ingredientSearch]);

  // Optimización: Ingredientes más comunes para mostrar primero
  const commonIngredients = useMemo(() => {
    const common = ['Aceite', 'Sal', 'Pimienta', 'Cebolla', 'Ajo', 'Tomate', 'Harina', 'Huevo', 'Leche', 'Mantequilla'];
    return ingredients.filter(ing => common.some(c => ing.nombre.toLowerCase().includes(c.toLowerCase())));
  }, [ingredients]);

  const otherIngredients = useMemo(() => {
    const common = ['Aceite', 'Sal', 'Pimienta', 'Cebolla', 'Ajo', 'Tomate', 'Harina', 'Huevo', 'Leche', 'Mantequilla'];
    return ingredients.filter(ing => !common.some(c => ing.nombre.toLowerCase().includes(c.toLowerCase())));
  }, [ingredients]);

  // Optimización: Filtrar ingredientes con búsqueda mejorada
  const filteredIngredients = useMemo(() => {
    const searchTerm = debouncedSearch.toLowerCase().trim();
    
    if (!searchTerm) {
      // Mostrar ingredientes comunes primero, luego otros
      return [...commonIngredients, ...otherIngredients];
    }
    
    return ingredients.filter(ing => 
      ing.nombre.toLowerCase().includes(searchTerm)
    );
  }, [ingredients, debouncedSearch, commonIngredients, otherIngredients]);

  // Optimización: Memorizar función toggle
  const toggle = useCallback((list: string[], setList: Function, value: string) => {
    setList((prev: string[]) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  }, []);

  const handleSave = () => {
    setFilters({
      user: userSearch,
      include,
      exclude,
      categories: selectedCategories,
    });
    navigation.goBack();
  };

  const handleClear = () => {
    setUserSearch('');
    setInclude([]);
    setExclude([]);
    setSelectedCategories([]);
    setFilters({ user: '', include: [], exclude: [], categories: [] });
    navigation.goBack();
  };

  // Optimización: Cargar datos en paralelo
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ingRes, catRes] = await Promise.all([
          fetch(`${API_BASE_URL}/ingredients`),
          fetch(`${API_BASE_URL}/tipos`)
        ]);

        const [ingData, catData] = await Promise.all([
          ingRes.json(),
          catRes.json()
        ]);

        if (ingData.status === 200) setIngredients(ingData.data);
        if (catData.status === 200) setCategories(catData.data);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Optimización: Memorizar estado inicial
  useEffect(() => {
    if (!hasLoadedInitialState.current && !loading) {
      setUserSearch(filters.user || '');
      setInclude(filters.include || []);
      setExclude(filters.exclude || []);
      setSelectedCategories(filters.categories || []);
      hasLoadedInitialState.current = true;
    }
  }, [filters, loading]);

  // Componente optimizado para ingredientes
  const renderIngredientChip = useCallback(({ item, isIncluded, isExcluded, onPress }: any) => (
    <TouchableOpacity
      style={[
        styles.chip,
        isIncluded && styles.included,
        isExcluded && styles.excluded
      ]}
      onPress={onPress}
    >
      <Text style={styles.chipText}>{item.nombre}</Text>
    </TouchableOpacity>
  ), []);

  // Componente optimizado para categorías
  const renderCategoryChip = useCallback(({ item, isSelected, onPress }: any) => (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.included]}
      onPress={onPress}
    >
      <Text style={styles.chipText}>{item.nombre}</Text>
    </TouchableOpacity>
  ), []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#23294c" />
        <Text style={styles.loadingText}>Cargando filtros...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} />
      </TouchableOpacity>

      <Text style={styles.title}>Filtro</Text>

      <TextInput
        placeholder="Búsqueda por usuario"
        placeholderTextColor="#666"
        value={userSearch}
        onChangeText={setUserSearch}
        style={styles.input}
      />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>Ingredientes que incluye:</Text>
        
        <TextInput
          placeholder="Buscar ingrediente..."
          placeholderTextColor="#666"
          value={ingredientSearch}
          onChangeText={setIngredientSearch}
          style={styles.searchInput}
        />

        <View style={styles.chipContainer}>
          {filteredIngredients.map((ing: any, index: number) => (
            <View key={`include-${ing.idIngrediente || index}`}>
              {renderIngredientChip({
                item: ing,
                isIncluded: include.includes(ing.nombre),
                isExcluded: exclude.includes(ing.nombre),
                onPress: () => toggle(include, setInclude, ing.nombre)
              })}
            </View>
          ))}
        </View>

        <Text style={styles.section}>Ingredientes que excluye:</Text>
        <View style={styles.chipContainer}>
          {filteredIngredients.map((ing: any, index: number) => (
            <View key={`exclude-${ing.idIngrediente || index}`}>
              {renderIngredientChip({
                item: ing,
                isIncluded: include.includes(ing.nombre),
                isExcluded: exclude.includes(ing.nombre),
                onPress: () => toggle(exclude, setExclude, ing.nombre)
              })}
            </View>
          ))}
        </View>

        <Text style={styles.section}>Tipo de Receta:</Text>
        <View style={styles.chipContainer}>
          {categories.map((cat: any, index: number) => (
            <View key={`category-${cat.idTipo || index}`}>
              {renderCategoryChip({
                item: cat,
                isSelected: selectedCategories.includes(cat.nombre),
                onPress: () => toggle(selectedCategories, setSelectedCategories, cat.nombre)
              })}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Guardar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearText}>Limpiar filtros</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  back: { marginBottom: 8 },
  title: { fontWeight: 'bold', fontSize: 20, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    color: '#000',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    color: '#000',
    fontSize: 14,
  },
  section: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  included: { backgroundColor: '#61c267' },
  excluded: { backgroundColor: '#ff5e5e' },
  chipText: { color: '#000', fontSize: 14 },
  saveBtn: {
    backgroundColor: '#23294c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 20,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  clearBtn: {
    backgroundColor: '#999',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  clearText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FilterScreen;
