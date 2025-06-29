// screens/RecipeStepsScreen.tsx
import React, { useState } from 'react';
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
import { useRecipeContext } from '../context/RecipeContext';
import { Recipe, Step, RootStackParamList } from '../types';

const RecipeStepsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { addRecipe, editRecipe } = useRecipeContext();

  const route = useRoute<any>();
  const recipe = route.params?.recipe as Recipe;

  const [steps, setSteps] = useState(recipe?.steps || []);
  //const [steps, setSteps] = useState<{ text: string; image: any }[]>(recipe?.steps?.length > 0 ? recipe.steps : []);

  const addStep = () => {
    setSteps([...steps, { text: '', imageUrl: '' }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const updated = steps.filter((_, i) => i !== index);
      setSteps(updated);
    } else {
      Alert.alert('Error', 'Debe tener al menos un paso');
    }
  };

  const handleChange = (index: number, field: keyof Step, value: any) => {
    const updated = [...steps];
    (updated[index] as any)[field] = value;
    setSteps(updated);
  };

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
        
        // Mostrar mensaje temporal
        Alert.alert('¡Éxito!', 'Receta creada con éxito. Serás redirigido en un momento...');

        // Redirigir automáticamente después de 2 segundos
        setTimeout(() => {
          navigation.navigate('HomeTabs', { screen: 'MyRecipesScreen' });
        }, 2000);

        //navigation.navigate('RecipeDetails', { recipe: completeRecipe });
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
          
          <TextInput
            placeholder="URL de imagen (opcional)"
            value={step.imageUrl || ''}
            onChangeText={(url: string) => handleChange(index, 'imageUrl', url)}
            style={styles.imageInput}
          />
          
          {step.imageUrl && step.imageUrl.trim() !== '' && (
            <Image 
              source={{ uri: step.imageUrl }} 
              style={styles.img}
              onError={() => console.log('Error loading image:', step.imageUrl)}
            />
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
  imageInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
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