// screens/RecipeFormScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useRecipeContext } from '../context/RecipeContext';
//import MyRecipesScreen from '../screens/MyRecipesScreen';
import { Recipe, RootStackParamList } from '../types';
import { useUserContext } from '../context/UserContext'; // <-- Agrega este import
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

const generateId = () => Math.random().toString(36).substring(2, 10);

const RecipeFormScreen = () => {
  const { addRecipe, editRecipe, deleteRecipe, getRecipeDetails } = useRecipeContext();

  const { user } = useUserContext(); // <-- Obtén el usuario autenticado
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<any>();

  // Loader mientras el usuario se carga
  const [checkingUser, setCheckingUser] = useState(true);
  const [loadingRecipeDetails, setLoadingRecipeDetails] = useState(false);
  const editingRecipe: Recipe | undefined = route.params?.recipe;

  const [imageUri, setImageUri] = useState<string | null>(() => {
    if (editingRecipe?.image && typeof editingRecipe.image === 'object' && 'uri' in editingRecipe.image) {
      return editingRecipe.image.uri || null;
    }
    return null;
  });

  //const editingRecipe: Recipe | undefined = route.params?.recipe;
  const [isEditing] = useState(() => !!editingRecipe);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<{ text: string; image: any }[]>([]);
  const [ingredients, setIngredients] = useState<{ name: string; quantity: number }[]>([]);
  const [servings, setServings] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const categories = [
    { id: 1, name: 'Panaderia' },
    { id: 2, name: 'Cocina Salada' },
    { id: 3, name: 'Reposteria' },
    { id: 4, name: 'Bebidas' },
    { id: 5, name: 'Ensaladas' },
    { id: 6, name: 'Postres' },
    { id: 7, name: 'Sopas' },
    { id: 8, name: 'Platos Principales' },
    { id: 9, name: 'Aperitivos' },
    { id: 10, name: 'Salsas' },
];

  useEffect(() => {
    // Espera un ciclo de render para que el contexto se actualice
    const timeout = setTimeout(() => setCheckingUser(false), 300);
    return () => clearTimeout(timeout);
  }, [user]);

  
  useEffect(() => {
    if (editingRecipe) {
      // Cargar datos actualizados desde el backend al editar
      const loadRecipeDetails = async () => {
        setLoadingRecipeDetails(true);
        try {
          console.log('🔍 Cargando detalles para edición:', editingRecipe.id);
          const completeRecipe = await getRecipeDetails(editingRecipe.id);
          
          if (completeRecipe) {
            console.log('✅ Detalles cargados para edición:', {
              ingredients: completeRecipe.ingredients?.length || 0,
              steps: completeRecipe.steps?.length || 0
            });
            
            // Usar datos del backend si están disponibles, sino usar los datos locales
            setTitle(completeRecipe.title || editingRecipe.title);
            setAuthor(completeRecipe.author || editingRecipe.author);
            setDescription(completeRecipe.description || editingRecipe.description || '');
            setSteps((completeRecipe.steps || editingRecipe.steps)?.map(step => ({
              text: step.text || step.description || '',
              image: step.image
            })) || []);
            setIngredients(completeRecipe.ingredients || editingRecipe.ingredients || []);
            setServings((completeRecipe.servings || editingRecipe.servings || 1).toString());
            setCategoryId((completeRecipe.categoryId || editingRecipe.categoryId || '').toString());
          } else {
            console.log('⚠️ No se pudieron cargar detalles, usando datos locales');
            // Usar datos locales como fallback
            setTitle(editingRecipe.title);
            setAuthor(editingRecipe.author);
            setDescription(editingRecipe.description || '');
            setSteps(editingRecipe.steps?.map(step => ({
              text: step.text || step.description || '',
              image: step.image
            })) || []);
            setIngredients(editingRecipe.ingredients || []);
            setServings((editingRecipe.servings || 1).toString());
            setCategoryId((editingRecipe.categoryId || '').toString());
          }
        } catch (error) {
          console.error('❌ Error al cargar detalles para edición:', error);
          // Usar datos locales como fallback
          setTitle(editingRecipe.title);
          setAuthor(editingRecipe.author);
          setDescription(editingRecipe.description || '');
          setSteps(editingRecipe.steps?.map(step => ({
            text: step.text || step.description || '',
            image: step.image
          })) || []);
          setIngredients(editingRecipe.ingredients || []);
          setServings((editingRecipe.servings || 1).toString());
          setCategoryId((editingRecipe.categoryId || '').toString());
        } finally {
          setLoadingRecipeDetails(false);
        }
      };

      loadRecipeDetails();
    }
  }, [editingRecipe, getRecipeDetails]);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  if (checkingUser || loadingRecipeDetails) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#23294c" />
        <Text style={{ marginTop: 10, color: '#666' }}>
          {checkingUser ? 'Verificando usuario...' : 'Cargando datos de la receta...'}
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: 'red', textAlign: 'center' }}>
          Debes iniciar sesión para crear o editar una receta.
        </Text>
      </View>
    );
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
     console.log(result);
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  /* const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso requerido', 'Se necesita permiso para acceder a la galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      //mediaTypes: ImagePicker.MediaTypeOptions.Images,
      mediaTypes: [ImagePicker.MediaType.Image],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  }; */

  const handleSubmit = () => {
    if (!editingRecipe) {
      // Validaciones solo al crear nueva receta
      if (!title || !author || !description || !servings || !categoryId) {
        Alert.alert('Error', 'Todos los campos son obligatorios.');
        return;
      }

      // Validar que categoryId sea un número válido
      const parsedCategoryId = parseInt(categoryId, 10);
      if (isNaN(parsedCategoryId)) {
        Alert.alert('Error', 'Debe seleccionar una categoría válida.');
        return;
      }

      if (ingredients.length === 0 || ingredients.some(i => !i.name || !i.quantity)) {
        Alert.alert('Error', 'Debe ingresar al menos un ingrediente con cantidad.');
        return;
      }
    }



    const recipeData: Recipe = {
      id: editingRecipe?.id || generateId(),
      title,
      author,
      description,
      rating: editingRecipe?.rating || 0,
      category: categories.find(cat => cat.id === parseInt(categoryId, 10))?.name || 'Sin categoría',
      //image: editingRecipe?.image || require('../assets/placeholder.jpg'),
      image: imageUri ? { uri: imageUri } : require('../assets/placeholder.jpg'),
      //image: imageUri ? { uri: imageUri } : (editingRecipe?.image || require('../assets/placeholder.jpg')),
      //image: { uri: imageUri },
      ingredients,
      steps,
      createdByUser: true,
      servings: parseInt(servings, 10) || 1,
      categoryId: parseInt(categoryId, 10),
    };

    if (editingRecipe) {
      editRecipe(editingRecipe.id, recipeData);
      //navigation.navigate('RecipeDetails', { recipe: recipeData });MyRecipesScreen
      navigation.navigate('RecipeDetails', { recipe: recipeData, fromEdit: true });
      //navigation.navigate('HomeTabs', { screen: 'Mis Recetas' });
    } else {
      //addRecipe(recipeData);
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
        description,
        rating: editingRecipe?.rating || 0,
        category: categories.find(cat => cat.id === parseInt(categoryId, 10))?.name || 'Sin categoría',
        //image: editingRecipe?.image || require('../assets/placeholder.jpg'),
        image: imageUri ? { uri: imageUri } : (editingRecipe?.image || require('../assets/placeholder.jpg')),
        ingredients,
        steps: steps.length > 0 ? steps : (editingRecipe?.steps || []),
        createdByUser: true,
        servings: parseInt(servings, 10),
        categoryId: parseInt(categoryId, 10),
      },
    });
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    const updated = [...ingredients];
    if (field === 'quantity') {
      updated[index] = { ...updated[index], quantity: parseFloat(value) || 0 };
    } else {
      updated[index] = { ...updated[index], name: value };
    }
    setIngredients(updated);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: 0 }]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* <Text style={styles.label}>Imagen de la receta *</Text> */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, marginBottom: 10, borderRadius: 8 }} />
      ) : (
        <Image source={require('../assets/placeholder.jpg')} style={{ width: '100%', height: 180, marginBottom: 10, borderRadius: 8 }} />
      )}
      <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
        <Text style={styles.secondaryText}>Seleccionar imagen</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Título *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Autor *</Text>
      <TextInput style={styles.input} value={author} onChangeText={setAuthor} />

      <Text style={styles.label}>Descripción *</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Porciones *</Text>
      <TextInput
        style={styles.input}
        value={servings}
        onChangeText={setServings}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Tipo de Receta *</Text>
      <Picker
        selectedValue={categoryId}
        onValueChange={(itemValue) => setCategoryId(itemValue)}
        style={styles.input}
      >
        <Picker.Item label="Selecciona una categoría" value="" />
        {categories.map((cat) => 
          React.createElement(Picker.Item, {
            key: cat.id,
            label: cat.name,
            value: cat.id.toString()
          })
        )}
      </Picker>

      <Text style={styles.label}>Ingredientes (con cantidad en gramos) *</Text>
      {ingredients.map((ingredient, index) => 
        React.createElement(View, {
          key: index,
          style: { flexDirection: 'row', gap: 6, marginBottom: 8 }
        }, [
          React.createElement(TextInput, {
            key: 'name',
            placeholder: "Ingrediente",
            style: [styles.input, { flex: 2 }],
            value: ingredient.name,
            onChangeText: (text: string) => updateIngredient(index, 'name', text)
          }),
          React.createElement(TextInput, {
            key: 'quantity',
            placeholder: "Cantidad",
            style: [styles.input, { flex: 1 }],
            keyboardType: "numeric",
            value: ingredient.quantity.toString(),
            onChangeText: (text: string) => updateIngredient(index, 'quantity', text)
          })
        ])
      )}
      

      <TouchableOpacity onPress={addIngredient}>
        <Text style={{ color: '#007BFF', marginBottom: 10 }}>+ Agregar ingrediente</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>
          {editingRecipe ? 'Guardar cambios' : 'Siguiente: Agregar Pasos'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancelar</Text>
      </TouchableOpacity>

      

      {editingRecipe && (
        <>
          <TouchableOpacity style={styles.secondaryButton} onPress={goToStepEditor}>
            <Text style={styles.secondaryText}>Editar pasos</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity> */}
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
    fontSize: 15,
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
    marginTop: 15,
    backgroundColor: '#23294c',
    padding: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: '#23244c',
    padding: 12,
    borderRadius: 29,
    alignItems: 'center',
  },
  secondaryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15
  },
  cancelButton: {
    marginTop: 10,
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  cancelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
