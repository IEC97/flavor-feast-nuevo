import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useRecipeContext } from '../context/RecipeContext';
import { useFilterContext } from '../context/FilterContext';

const MyRecipesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const { myRecipes, deleteRecipe } = useRecipeContext();

  const goToEdit = (recipe: any) => {
    navigation.navigate('RecipeForm', { recipe });
  };

  const goToCreate = () => {
    navigation.navigate('RecipeForm');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Recetas</Text>

      <FlatList
  data={myRecipes}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RecipeDetails', { recipe: item })}
    >
      <Image source={item.image} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.name}>{item.title}</Text>
        <Text style={styles.rating}>{'⭐'.repeat(item.rating)}</Text>
        <Text style={{ fontSize: 12, color: 'gray' }}>
          ID: {item.id} - createdByUser: {String(item.createdByUser)}
        </Text>
      </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => goToEdit(item)}>
                <Ionicons name="create-outline" size={22} color="#555" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  console.log('🧪 BOTÓN ELIMINAR PRESIONADO:', item.id);
                  deleteRecipe(item.id);
                  navigation.navigate('HomeTabs', { screen: 'MyRecipes' });
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#c00" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.button} onPress={goToCreate}>
        <Text style={styles.buttonText}>Nueva receta</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  image: { width: 100, height: 100 },
  content: { flex: 1, padding: 10, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold' },
  rating: { marginTop: 4, color: '#f1c40f' },
  actions: {
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  button: {
    backgroundColor: '#23294c',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff', fontWeight: 'bold', fontSize: 16,
  },
});

export default MyRecipesScreen;
