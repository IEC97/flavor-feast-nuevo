// Ruta: screens/FilterScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
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
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const hasLoadedInitialState = useRef(false);

  const toggle = (list: string[], setList: Function, value: string) => {
    setList((prev: string[]) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ingRes = await fetch(`${API_BASE_URL}/ingredients`);
        const catRes = await fetch(`${API_BASE_URL}/tipos`);

        const ingData = await ingRes.json();
        const catData = await catRes.json();

        if (ingData.status === 200) setIngredients(ingData.data);
        if (catData.status === 200) setCategories(catData.data);
      } catch (error) {
        console.error('Error al obtener datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!hasLoadedInitialState.current && !loading) {
      setUserSearch(filters.user || '');
      setInclude(filters.include || []);
      setExclude(filters.exclude || []);
      setSelectedCategories(filters.categories || []);
      hasLoadedInitialState.current = true;
    }
  }, [filters, loading]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#23294c" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} />
      </TouchableOpacity>

      <Text style={styles.title}>Filtro</Text>

      <TextInput
        placeholder="Búsqueda por usuario"
        value={userSearch}
        onChangeText={setUserSearch}
        style={styles.input}
      />

      <Text style={styles.section}>Ingredientes que incluye:</Text>
      <View style={styles.chipContainer}>
        {ingredients.map((ing: any) => (
          <TouchableOpacity
            key={ing.idIngrediente}
            style={[styles.chip, include.includes(ing.nombre) && styles.included]}
            onPress={() => toggle(include, setInclude, ing.nombre)}
          >
            <Text style={styles.chipText}>{ing.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Ingredientes que excluye:</Text>
      <View style={styles.chipContainer}>
        {ingredients.map((ing: any) => (
          <TouchableOpacity
            key={ing.idIngrediente + '_exclude'}
            style={[styles.chip, exclude.includes(ing.nombre) && styles.excluded]}
            onPress={() => toggle(exclude, setExclude, ing.nombre)}
          >
            <Text style={styles.chipText}>{ing.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Tipo de Receta:</Text>
      <View style={styles.chipContainer}>
        {categories.map((cat: any) => (
          <TouchableOpacity
            key={cat.idCategoria}
            style={[styles.chip, selectedCategories.includes(cat.nombre) && styles.included]}
            onPress={() => toggle(selectedCategories, setSelectedCategories, cat.nombre)}
          >
            <Text style={styles.chipText}>{cat.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>Guardar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
        <Text style={styles.clearText}>Limpiar filtros</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 40 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { marginBottom: 8 },
  title: { fontWeight: 'bold', fontSize: 20, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  section: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 40,
  },
  chip: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  included: { backgroundColor: '#61c267' },
  excluded: { backgroundColor: '#ff5e5e' },
  chipText: { color: '#000' },
  saveBtn: {
    backgroundColor: '#23294c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearBtn: {
    backgroundColor: '#999',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FilterScreen;
