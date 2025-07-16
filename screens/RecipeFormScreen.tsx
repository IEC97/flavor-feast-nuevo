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
  Image,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipeContext } from '../context/RecipeContext';
import { Recipe, RootStackParamList, AvailableIngredient } from '../types';
import { useUserContext } from '../context/UserContext';
import { Picker } from '@react-native-picker/picker';
import LoadingSpinner from '../components/LoadingSpinner';
import { API_BASE_URL } from '../constants';

const generateId = () => Math.random().toString(36).substring(2, 10);

// Helper para convertir ingredientes del backend al formato del formulario
const convertIngredientsToFormFormat = (ingredients: any[]) => {
  return ingredients.map((ing, index) => ({
    id: index + 1, // ID temporal para el formulario
    ingredientId: ing.id || ing.idIngrediente || 1, // ID del ingrediente en la DB
    quantity: ing.quantity || ing.cantidad || 0,
    unit: ing.unit || ing.unidad || 'gramos',
  }));
};

// Helper para convertir ingredientes del formulario al formato del Recipe
const convertIngredientsToRecipeFormat = (formIngredients: any[], availableIngredients: AvailableIngredient[]) => {
  return formIngredients.map(ing => {
    const availableIng = availableIngredients.find(ai => ai.id === ing.ingredientId);
    return {
      id: ing.ingredientId,
      name: availableIng?.name || 'Ingrediente desconocido',
      quantity: ing.quantity,
      unit: ing.unit,
    };
  });
};

const RecipeFormScreen = () => {
  const { addRecipe, editRecipe, deleteRecipe, getRecipeDetails, getAvailableIngredients } = useRecipeContext();

  const { user } = useUserContext(); // <-- Obtén el usuario autenticado
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<any>();

  // Loader mientras el usuario se carga
  const [checkingUser, setCheckingUser] = useState(true);
  const [loadingRecipeDetails, setLoadingRecipeDetails] = useState(false);
  const editingRecipe: Recipe | undefined = route.params?.recipe;

  const [imageUrl, setImageUrl] = useState<string>(() => {
    if (editingRecipe?.image && typeof editingRecipe.image === 'object' && 'uri' in editingRecipe.image) {
      return editingRecipe.image.uri || '';
    }
    return '';
  });

  //const editingRecipe: Recipe | undefined = route.params?.recipe;
  const [isEditing] = useState(() => !!editingRecipe);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<{ text: string; image: any }[]>([]);
  const [ingredients, setIngredients] = useState<{ id: number; ingredientId: number; quantity: number; unit: string }[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<AvailableIngredient[]>([]);
  const [servings, setServings] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  useEffect(() => {
    // Espera un ciclo de render para que el contexto se actualice
    const timeout = setTimeout(() => setCheckingUser(false), 300);
    return () => clearTimeout(timeout);
  }, [user]);

  // Cargar ingredientes disponibles
  useEffect(() => {
    const loadAvailableIngredients = async () => {
      try {
        const ingredients = await getAvailableIngredients();
        setAvailableIngredients(ingredients);
      } catch (error) {
        console.error('Error al cargar ingredientes disponibles:', error);
      }
    };
    loadAvailableIngredients();
  }, [getAvailableIngredients]);

  // Cargar categorías del backend
  useEffect(() => {
    const loadCategories = async () => {
      if (categoriesLoaded) return; // Solo cargar una vez
      
      try {
        const response = await fetch(`${API_BASE_URL}/tipos`);
        const json = await response.json();
        
        if (json.status === 200 && json.data) {
          const adaptedCategories = json.data.map((cat: any) => ({
            id: parseInt(cat.idTipo, 10),
            name: cat.nombre
          }));
          setCategories(adaptedCategories);
          setCategoriesLoaded(true);
          console.log('✅ Categorías cargadas del backend:', adaptedCategories.length, 'categorías');
        } else {
          console.error('Error al cargar categorías:', json.message);
        }
      } catch (error) {
        console.error('Error al cargar categorías:', error);
        // Fallback a categorías hardcodeadas en caso de error
        setCategories([
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
        ]);
        setCategoriesLoaded(true);
      }
    };
    loadCategories();
  }, [categoriesLoaded]);

  // Sincronizar categoryId cuando se cargan las categorías y hay una receta en edición
  useEffect(() => {
    if (categoriesLoaded && editingRecipe && categories.length > 0) {
      // Si la receta tiene categoryId, usarlo
      if (editingRecipe.categoryId) {
        setCategoryId(editingRecipe.categoryId.toString());
      } else if (editingRecipe.category && typeof editingRecipe.category === 'string') {
        // Si no tiene categoryId pero tiene category name, buscar el ID correspondiente
        const foundCategory = categories.find(cat => cat.name === editingRecipe.category);
        if (foundCategory) {
          setCategoryId(foundCategory.id.toString());
        }
      }
    }
  }, [categoriesLoaded, editingRecipe, categories]);

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
              steps: completeRecipe.steps?.length || 0,
              categoryId: completeRecipe.categoryId,
              category: completeRecipe.category
            });
            
            // Usar datos del backend si están disponibles, sino usar los datos locales
            setTitle(completeRecipe.title || editingRecipe.title);
            setDescription(completeRecipe.description || editingRecipe.description || '');
            setSteps((completeRecipe.steps || editingRecipe.steps)?.map(step => ({
              text: step.text || step.description || '',
              image: step.image
            })) || []);
            setIngredients(convertIngredientsToFormFormat(completeRecipe.ingredients || editingRecipe.ingredients || []));
            setServings((completeRecipe.servings || editingRecipe.servings || 1).toString());
            
            const finalCategoryId = completeRecipe.categoryId || editingRecipe.categoryId;
            console.log('🏷️ CategoryId para formulario:', finalCategoryId, '(tipo:', typeof finalCategoryId, ')');
            
            // Si categoryId es undefined pero category es un número, usar category como categoryId
            if (!finalCategoryId && typeof completeRecipe.category === 'number') {
              console.log('🔄 Usando category como categoryId:', completeRecipe.category);
              setCategoryId((completeRecipe.category as number).toString());
            } else if (finalCategoryId) {
              setCategoryId(finalCategoryId.toString());
            } else {
              setCategoryId('');
            }
            
            // Cargar URL de imagen si existe
            if (completeRecipe.image && typeof completeRecipe.image === 'object' && 'uri' in completeRecipe.image) {
              setImageUrl(completeRecipe.image.uri || '');
            }
          } else {
            console.log('⚠️ No se pudieron cargar detalles, usando datos locales');
            console.log('🏷️ CategoryId de receta local:', editingRecipe.categoryId, '(tipo:', typeof editingRecipe.categoryId, ')');
            // Usar datos locales como fallback
            setTitle(editingRecipe.title);
            setDescription(editingRecipe.description || '');
            setSteps(editingRecipe.steps?.map(step => ({
              text: step.text || step.description || '',
              image: step.image
            })) || []);
            setIngredients(convertIngredientsToFormFormat(editingRecipe.ingredients || []));
            setServings((editingRecipe.servings || 1).toString());
            setCategoryId((editingRecipe.categoryId || '').toString());
          }
        } catch (error) {
          console.error('❌ Error al cargar detalles para edición:', error);
          console.log('🏷️ CategoryId de receta local (catch):', editingRecipe.categoryId, '(tipo:', typeof editingRecipe.categoryId, ')');
          // Usar datos locales como fallback
          setTitle(editingRecipe.title);
          setDescription(editingRecipe.description || '');
          setSteps(editingRecipe.steps?.map(step => ({
            text: step.text || step.description || '',
            image: step.image
          })) || []);
          setIngredients(convertIngredientsToFormFormat(editingRecipe.ingredients || []));
          setServings((editingRecipe.servings || 1).toString());
          setCategoryId((editingRecipe.categoryId || '').toString());
        } finally {
          setLoadingRecipeDetails(false);
        }
      };

      loadRecipeDetails();
    }
  }, [editingRecipe, getRecipeDetails]);

  if (checkingUser || loadingRecipeDetails) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LoadingSpinner 
          size="large" 
          text={checkingUser ? 'Verificando usuario...' : 'Cargando datos de la receta...'}
        />
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
    // Esta función ya no se necesita
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
  };

  const getImageSource = () => {
    if (imageUrl.trim()) {
      return { uri: imageUrl };
    }
    return require('../assets/placeholder.jpg');
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

  const handleSubmit = async () => {
    // Validaciones para crear nueva receta
    if (!title || !description || !servings || !categoryId) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos.');
      return;
    }

    // Validar que la URL de imagen sea obligatoria
    if (!imageUrl || imageUrl.trim() === '') {
      Alert.alert('Error', 'Debe ingresar una URL de imagen válida.');
      return;
    }

    // Validar que categoryId sea un número válido
    const parsedCategoryId = parseInt(categoryId, 10);
    if (isNaN(parsedCategoryId)) {
      Alert.alert('Error', 'Debe seleccionar una categoría válida.');
      return;
    }

    if (ingredients.length === 0 || ingredients.some(i => !i.ingredientId || !i.quantity)) {
      Alert.alert('Error', 'Debe ingresar al menos un ingrediente con cantidad.');
      return;
    }

    // Solo permitir navegar a pasos, no guardar directamente
    const recipeData: Recipe = {
      id: editingRecipe?.id || '', // No generar ID temporal para nuevas recetas
      title,
      author: user?.username || user?.email || 'Usuario', // Usar datos del usuario autenticado
      description,
      rating: editingRecipe?.rating || 0,
      category: categories.find(cat => cat.id === parseInt(categoryId, 10))?.name || 'Sin categoría',
      image: getImageSource(), // Usar la función para obtener la imagen correcta
      ingredients: convertIngredientsToRecipeFormat(ingredients, availableIngredients),
      steps: steps.length > 0 ? steps : (editingRecipe?.steps || []),
      createdByUser: true,
      servings: parseInt(servings, 10) || 1,
      categoryId: parseInt(categoryId, 10),
      // Establecer fecha actual
      createdAt: editingRecipe?.createdAt || Date.now(),
    };

    // Siempre navegar a los pasos, tanto para crear como para editar
    navigation.navigate('RecipeSteps', { recipe: recipeData });
  };

  const handleServingsChange = (text: string) => {
    // Solo permitir números
    const numericValue = text.replace(/[^0-9]/g, '');
    setServings(numericValue);
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
            navigation.navigate('HomeTabs', { screen: 'Mis Recetas' });
          },
        },
      ]);
    }
  };

  const updateIngredient = (index: number, field: 'ingredientId' | 'quantity' | 'unit', value: string) => {
    const updated = [...ingredients];
    if (field === 'quantity') {
      updated[index] = { ...updated[index], quantity: parseFloat(value) || 0 };
    } else if (field === 'ingredientId') {
      updated[index] = { ...updated[index], ingredientId: parseInt(value) || 1 };
    } else if (field === 'unit') {
      updated[index] = { ...updated[index], unit: value };
    }
    setIngredients(updated);
  };

  const addIngredient = () => {
    const newId = ingredients.length + 1;
    const defaultIngredientId = availableIngredients.length > 0 ? availableIngredients[0].id : 1;
    setIngredients([...ingredients, { 
      id: newId, 
      ingredientId: defaultIngredientId, 
      quantity: 0, 
      unit: 'gramos' 
    }]);
  };

  return (
    <View style={styles.screenContainer}>
      {/* Botón de back */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>
      
      {/* Sección de imagen simplificada - Solo URL */}
      <Text style={styles.label}>Imagen de la receta *</Text>
      
      {/* Vista previa de la imagen */}
      <Image source={getImageSource()} style={styles.imagePreview} />

      {/* Campo para URL de imagen */}
      <TextInput
        style={styles.imageUrlInput}
        placeholder="URL de imagen OBLIGATORIA (ej: https://ejemplo.com/imagen.jpg)"
        placeholderTextColor="#000"
        value={imageUrl}
        onChangeText={handleImageUrlChange}
        keyboardType="url"
        autoCapitalize="none"
      />
      <Text style={styles.helperText}>
        Campo obligatorio. Asegúrate de que la URL termine en .jpg, .png, .gif o .webp
      </Text>

      <Text style={styles.label}>Título *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor="#000" />

      <Text style={styles.label}>Descripción *</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholderTextColor="#000"
        multiline
      />

      <Text style={styles.label}>Porciones *</Text>
      <TextInput
        style={styles.input}
        value={servings}
        onChangeText={handleServingsChange}
        keyboardType="numeric"
        placeholder="Ej: 4"
        placeholderTextColor="#000"
      />

      <Text style={styles.label}>Tipo de Receta *</Text>
      {!categoriesLoaded ? (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#666' }}>Cargando categorías...</Text>
        </View>
      ) : (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={categoryId}
            onValueChange={(itemValue) => setCategoryId(itemValue)}
            style={styles.picker}
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
        </View>
      )}

      <Text style={styles.label}>Ingredientes *</Text>
      {availableIngredients.length === 0 ? (
        React.createElement(View, {
          style: { padding: 16, alignItems: 'center' }
        }, React.createElement(Text, {
          style: { color: '#666' }
        }, 'Cargando ingredientes disponibles...'))
      ) : (
        ingredients.map((ingredient, index) => {
          const selectedIngredient = availableIngredients.find(ai => ai.id === ingredient.ingredientId);
          return React.createElement(View, {
            key: index,
            style: { marginBottom: 12, padding: 8, backgroundColor: '#f8f8f8', borderRadius: 8 }
          }, [
          React.createElement(Text, {
            key: 'title',
            style: { fontWeight: 'bold', marginBottom: 8, fontSize: 14 }
          }, `Ingrediente ${index + 1}`),
          
          React.createElement(Text, {
            key: 'selectLabel',
            style: { marginBottom: 4, fontWeight: '500' }
          }, 'Seleccionar ingrediente:'),
          
          React.createElement(View, {
            key: 'pickerWrapper',
            style: styles.pickerContainer
          }, React.createElement(Picker, {
            key: 'picker',
            selectedValue: (ingredient.ingredientId || 1).toString(),
            onValueChange: (value: unknown) => updateIngredient(index, 'ingredientId', value as string),
            style: styles.picker
          }, [
            React.createElement(Picker.Item, {
              key: 'placeholder',
              label: "Selecciona un ingrediente",
              value: ""
            }),
            ...availableIngredients.map((availableIng) => 
              React.createElement(Picker.Item, {
                key: availableIng.id,
                label: availableIng.name,
                value: availableIng.id.toString()
              })
            )
          ])),
          
          React.createElement(View, {
            key: 'quantityRow',
            style: { flexDirection: 'row', gap: 8 }
          }, [
            React.createElement(View, {
              key: 'quantityContainer',
              style: { flex: 1 }
            }, [
              React.createElement(Text, {
                key: 'quantityLabel',
                style: { marginBottom: 4, fontWeight: '500' }
              }, 'Cantidad:'),
              React.createElement(TextInput, {
                key: 'quantity',
                placeholder: "Cantidad",
                placeholderTextColor: "#000",
                style: styles.input,
                keyboardType: "numeric",
                value: ingredient.quantity.toString(),
                onChangeText: (text: string) => updateIngredient(index, 'quantity', text)
              })
            ]),
            
            React.createElement(View, {
              key: 'unitContainer',
              style: { flex: 1 }
            }, [
              React.createElement(Text, {
                key: 'unitLabel',
                style: { marginBottom: 4, fontWeight: '500' }
              }, 'Unidad:'),
              React.createElement(TextInput, {
                key: 'unit',
                placeholder: "ej: gramos, ml, unidades",
                placeholderTextColor: "#000",
                style: styles.input,
                value: ingredient.unit,
                onChangeText: (text: string) => updateIngredient(index, 'unit', text)
              })
            ])
          ]),
          
          React.createElement(TouchableOpacity, {
            key: 'removeButton',
            onPress: () => {
              const updated = ingredients.filter((_, i) => i !== index);
              setIngredients(updated);
            },
            style: { 
              backgroundColor: '#dc3545', 
              padding: 8, 
              borderRadius: 4, 
              alignItems: 'center',
              marginTop: 8
            }
          }, React.createElement(Text, {
            style: { color: 'white', fontSize: 12 }
          }, 'Eliminar ingrediente'))
        ]);
      }))}
      

      <TouchableOpacity onPress={addIngredient}>
        <Text style={{ color: '#007BFF', marginBottom: 10 }}>+ Agregar ingrediente</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          {editingRecipe ? 'Siguiente: Editar Pasos' : 'Siguiente: Agregar Pasos'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancelar</Text>
      </TouchableOpacity>

      

      {editingRecipe && (
        <>
          {/* Botón de editar pasos removido ya que el botón principal siempre va a los pasos */}
        </>
      )}
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#00000066',
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  container: {
    padding: 16,
    paddingTop: 60, // Reducido de 80 a 60
    paddingBottom: 40, // Espacio para la barra de navegación inferior
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
    color: '#000', // Texto negro
  },
  imageUrlInput: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
    color: '#000', // Texto gris claro para URL de imagen
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d0d0d0', // Borde negro
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: '#fff',
  },
  picker: {
    color: '#000', // Texto negro
    backgroundColor: '#fff',
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  // Estilos para imagen
  imagePreview: {
    width: '100%',
    height: 200,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 10,
    fontStyle: 'italic',
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
