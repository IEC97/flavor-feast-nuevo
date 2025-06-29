// screens/RecipeStepsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRecipeContext } from '../context/RecipeContext';
import { Recipe, RootStackParamList } from '../types';

const RecipeStepsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { addRecipe, editRecipe } = useRecipeContext();

  const route = useRoute<any>();
  const recipe = route.params?.recipe as Recipe;

  const [steps, setSteps] = useState(recipe?.steps || []);
  //const [steps, setSteps] = useState<{ text: string; image: any }[]>(recipe?.steps?.length > 0 ? recipe.steps : []);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);



  const addStep = () => {
    setSteps([...steps, { text: '', image: undefined }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const updated = steps.filter((_, i) => i !== index);
      setSteps(updated);
    } else {
      Alert.alert('Error', 'Debe tener al menos un paso');
    }
  };

  const handleChange = (index: number, field: 'text' | 'image', value: any) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const pickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    console.log(result);
    if (!result.canceled && result.assets && result.assets.length > 0) {
      handleChange(index, 'image', { uri: result.assets[0].uri });
    }
  };

  /* const pickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      //mediaTypes: ImagePicker.MediaTypeOptions.Images,
      mediaTypes: [ImagePicker.MediaType.Image],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      handleChange(index, 'image', { uri: result.assets[0].uri });
    }
  }; */

  const handleSave = async () => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      Alert.alert('Error', 'Debe ingresar al menos un ingrediente.');
      return;
    }
    
    const validSteps = steps.filter((step) => 
      (step.text && step.text.trim() !== '') || 
      (step.description && step.description.trim() !== '')
    );
    
    if (validSteps.length === 0) {
      Alert.alert('Error', 'Debe ingresar al menos un paso.');
      return;
    }

    // Crear la receta completa con los pasos validados
    const completeRecipe = {
      ...recipe,
      steps: validSteps,
    };

    try {
      // Si la receta tiene un ID (y es creada por el usuario), estamos editando una receta existente
      if (recipe.id && recipe.id.trim() !== '' && recipe.createdByUser) {
        console.log('Editando receta existente con ID:', recipe.id);
        await editRecipe(recipe.id, completeRecipe);
        navigation.navigate('RecipeDetails', { recipe: completeRecipe });
      } else {
        // Si no tiene ID o no es creada por el usuario, es una nueva receta
        console.log('Creando nueva receta - ID:', recipe.id, 'createdByUser:', recipe.createdByUser);
        await addRecipe(completeRecipe);
        navigation.navigate('RecipeDetails', { recipe: completeRecipe });
      }
    } catch (error) {
      console.error('Error al guardar la receta:', error);
      Alert.alert('Error', 'No se pudo guardar la receta. Inténtalo de nuevo.');
    }
  };
  

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Pasos de la receta</Text>

      {steps.map((step, index) => (
        <View key={index} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.label}>Paso {index + 1}</Text>
            {steps.length > 1 && (
              <TouchableOpacity 
                onPress={() => removeStep(index)}
                style={styles.removeBtn}
              >
                <Text style={styles.removeText}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TextInput
            placeholder="Descripción del paso"
            value={step.text || step.description || ''}
            onChangeText={(text: string) => handleChange(index, 'text', text)}
            style={styles.input}
            multiline
          />
          
          <TouchableOpacity 
            style={styles.imageBtn}
            onPress={() => pickImage(index)}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>
              {step.image ? 'Cambiar imagen' : 'Subir imagen'}
            </Text>
          </TouchableOpacity>
          
          {step.image && (
            <Image source={step.image} style={styles.img} />
          )}
        </View>
      ))}

      <TouchableOpacity onPress={addStep}>
        <Text style={styles.addStep}>+ Agregar otro paso</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>Guardar receta</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: '#6c757d', marginTop: 10 }]}
        onPress={() => navigation.goBack()}
        >
        <Text style={styles.saveText}>Cancelar</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  stepCard: {
    marginBottom: 16,
    backgroundColor: '#f3f3f3',
    padding: 12,
    borderRadius: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { fontWeight: 'bold', fontSize: 16 },
  removeBtn: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    minHeight: 60,
  },
  imageBtn: {
    backgroundColor: '#23244c',
    padding: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  img: {
    width: '100%',
    height: 150,
    marginTop: 8,
    borderRadius: 6,
  },
  addStep: {
    color: '#13162e',
    marginBottom: 20,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#23294c',
    padding: 14,
    alignItems: 'center',
    borderRadius: 30,
  },
  saveText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RecipeStepsScreen;