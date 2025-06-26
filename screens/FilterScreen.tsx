import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFilterContext } from '../context/FilterContext';

const ingredients = ['Huevo', 'Zanahoria', 'Tomate', 'Queso', 'Pollo', 'Lechuga', 'Arroz', 'Lentejas', 'Pan', 'Frutilla', 'Carne', 'Crema', 'Harina', 'Leche', 'Morron', 'Batata'];
const categories = ['Pizza', 'Pasta', 'Arroz', 'Postres', 'Verduras', 'Sopas', 'Carnes', 'Pescado', 'Ensaladas', 'Legumbres', 'Aperitivos'];

const FilterScreen = () => {
  const navigation = useNavigation();
  const { setFilters } = useFilterContext();
  const [userSearch, setUserSearch] = useState('');
  const [include, setInclude] = useState<string[]>([]);
  const [exclude, setExclude] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggle = (list: string[], setList: Function, value: string) => {
    setList((prev: string[]) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
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

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} />
      </TouchableOpacity>
      <Text style={styles.title}>Filtro</Text>
      <TextInput
        placeholder="Busqueda por usuario"
        value={userSearch}
        onChangeText={setUserSearch}
        style={styles.input}
      />

      <Text style={styles.section}>Ingredientes que incluye:</Text>
      <View style={styles.chipContainer}>
        {ingredients.map((ing) => (
          <TouchableOpacity
            key={ing}
            style={[styles.chip, include.includes(ing) && styles.included]}
            onPress={() => toggle(include, setInclude, ing)}
          >
            <Text style={styles.chipText}>{ing}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Ingredientes que excluye:</Text>
      <View style={styles.chipContainer}>
        {ingredients.map((ing) => (
          <TouchableOpacity
            key={ing}
            style={[styles.chip, exclude.includes(ing) && styles.excluded]}
            onPress={() => toggle(exclude, setExclude, ing)}
          >
            <Text style={styles.chipText}>{ing}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Tipo de Receta:</Text>
      <View style={styles.chipContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, selectedCategories.includes(cat) && styles.included]}
            onPress={() => toggle(selectedCategories, setSelectedCategories, cat)}
          >
            <Text style={styles.chipText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>Guardar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
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
  chipText: { color: '#000' },
  saveBtn: {
    backgroundColor: '#23294c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FilterScreen;