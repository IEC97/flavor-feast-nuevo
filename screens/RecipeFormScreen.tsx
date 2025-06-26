// screens/RecipeFormScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useRecipeContext } from '../context/RecipeContext';
import { Recipe } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 10);

const RecipeFormScreen = () => {
  const { addRecipe, editRecipe, deleteRecipe } = useRecipeContext();
  const navigation = useNavigation();
  const route = useRoute<any>();

  const editingRecipe: Recipe | undefined = route.params?.recipe;
  const [isEditing] = useState(!!editingRecipe);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<{ text: string; image: any }[]>([]);
  const [ingredients, setIngredients] = useState<{ name: string; quantity: number }[]>([]);

  useEffect(() => {
    if (editingRecipe) {
      setTitle(editingRecipe.title);
      setAuthor(editingRecipe.author);
      setTime(editingRecipe.time);
      setDescription(editingRecipe.description);
      setSteps(editingRecipe.steps || []);
      setIngredients(editingRecipe.ingredients || []);
    }
  }, [editingRecipe]);

  const handleSubmit = () => {
    if (!title || !author || !time || !description) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    if (ingredients.length === 0 || ingredients.some(i => !i.name || !i.quantity)) {
      Alert.alert('Error', 'Debe ingresar al menos un ingrediente con cantidad.');
      return;
    }

    const recipeData: Recipe = {
      id: editingRecipe?.id || generateId(),
      title,
      author,
      time,
      description,
      rating: editingRecipe?.rating || 0,
      image: editingRecipe?.image || require('../assets/placeholder.jpg'),
      ingredients,
      steps,
      createdByUser: true,
    };

    if (editingRecipe) {
      editRecipe(editingRecipe.id, recipeData);
      navigation.navigate('RecipeDetails', { recipe: recipeData });
    } else {
      addRecipe(recipeData);
      navigation.navigate('RecipeSteps', { recipe: recipeData });
    }
  };

  const handleDelete = () => {
    if (editingRecipe) {
      Alert.alert('Eliminar receta', '¿Estás seguro de que querés eliminar esta receta?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteRecipe(editingRecipe.id);
            navigation.navigate('HomeTabs', { screen: 'MyRecipes' });
          },
        },
      ]);
    }
  };

  const goToStepEditor = () => {
    navigation.navigate('RecipeSteps', {
      recipe: {
        id: editingRecipe?.id || generateId(),
        title,
        author,
        time,
        description,
        rating: editingRecipe?.rating || 0,
        image: editingRecipe?.image || require('../assets/placeholder.jpg'),
        ingredients,
        steps: steps.length > 0 ? steps : (editingRecipe?.steps || []),
        createdByUser: true,
      },
    });
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    const updated = [...ingredients];
    updated[index][field] = field === 'quantity' ? parseFloat(value) || 0 : value;
    setIngredients(updated);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: 0 }]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Título *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Autor *</Text>
      <TextInput style={styles.input} value={author} onChangeText={setAuthor} />

      <Text style={styles.label}>Tiempo *</Text>
      <TextInput style={styles.input} value={time} onChangeText={setTime} />

      <Text style={styles.label}>Descripción *</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Ingredientes (con cantidad en gramos) *</Text>
      {ingredients.map((ingredient, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
          <TextInput
            placeholder="Ingrediente"
            style={[styles.input, { flex: 2 }]}
            value={ingredient.name}
            onChangeText={(text) => updateIngredient(index, 'name', text)}
          />
          <TextInput
            placeholder="Cantidad"
            style={[styles.input, { flex: 1 }]}
            keyboardType="numeric"
            value={ingredient.quantity.toString()}
            onChangeText={(text) => updateIngredient(index, 'quantity', text)}
          />
        </View>
      ))}

      <TouchableOpacity onPress={addIngredient}>
        <Text style={{ color: '#007BFF', marginBottom: 10 }}>+ Agregar ingrediente</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>
          {editingRecipe ? 'Guardar cambios' : 'Siguiente: Agregar Pasos'}
        </Text>
      </TouchableOpacity>

      {editingRecipe && (
        <>
          <TouchableOpacity style={styles.secondaryButton} onPress={goToStepEditor}>
            <Text style={styles.secondaryText}>Editar pasos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: '#23244c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 10,
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButton: {
    marginTop: 20,
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default RecipeFormScreen;
