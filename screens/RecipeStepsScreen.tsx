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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRecipeContext } from '../context/RecipeContext';
import { Recipe } from '../types';

const RecipeStepsScreen = () => {
  const navigation = useNavigation();
  const { editRecipe } = useRecipeContext();

  const route = useRoute<any>();
  const recipe = route.params?.recipe as Recipe;


  const [steps, setSteps] = useState<{ text: string; image: any }[]>(recipe?.steps?.length > 0 ? recipe.steps : []);



  const addStep = () => {
    setSteps([...steps, { text: '', image: null }]);
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
    if (!result.canceled) {
      handleChange(index, 'image', { uri: result.assets[0].uri });
    }
  };

  const handleSave = () => {
    const validSteps = steps.filter((step) => step.text.trim() !== '');
    if (validSteps.length === 0) {
      alert('Debes ingresar al menos un paso con descripción.');
      return;
    }
    editRecipe(recipe.id, { ...recipe, steps: validSteps });
    navigation.navigate('HomeTabs');
  };
  

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Pasos de la receta</Text>

      {steps.map((step, index) => (
        <View key={index} style={styles.stepCard}>
          <Text style={styles.label}>Paso {index + 1}</Text>
          <TextInput
            placeholder="Descripción del paso"
            value={step.text}
            onChangeText={(text) => handleChange(index, 'text', text)}
            style={styles.input}
          />
          <TouchableOpacity style={styles.imageBtn} onPress={() => pickImage(index)}>
            <Text style={{ color: 'white' }}>{step.image ? 'Cambiar imagen' : 'Subir imagen'}</Text>
          </TouchableOpacity>
          {step.image && <Image source={step.image} style={styles.img} />}
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
  label: { fontWeight: 'bold', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  imageBtn: {
    backgroundColor: '#23244c',
    padding: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  img: {
    width: '100%',
    height: 150,
    marginTop: 8,
    borderRadius: 6,
  },
  addStep: {
    color: '#007AFF',
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: '#28a745',
    padding: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  saveText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default RecipeStepsScreen;