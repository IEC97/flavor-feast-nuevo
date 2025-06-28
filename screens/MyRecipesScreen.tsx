import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  //Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Agrega este import
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useRecipeContext } from '../context/RecipeContext';
import { useUserContext } from '../context/UserContext';
//import { useFilterContext } from '../context/FilterContext';

const MyRecipesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'RecipeForm'>>();
  const { myRecipes, deleteRecipe } = useRecipeContext();

  const { user } = useUserContext(); // <-- Agrega esto

  const [showPrompt, setShowPrompt] = React.useState(false);
  const [promptType, setPromptType] = React.useState<'create' | 'delete' | null>(null);
  const [recipeToDelete, setRecipeToDelete] = React.useState<string | null>(null);

  const goToEdit = (recipe: any) => {
    navigation.navigate('RecipeForm', { recipe });
  };

  const goToCreate = () => {
    if (!user) {
      // Si no hay usuario, muestra un mensaje o navega a Login
      alert('Debes iniciar sesión para crear una receta.');
      return;
    }
    setPromptType('create');
    setShowPrompt(true);
  };

  /* const goToCreate = () => {
    setPromptType('create');
    setShowPrompt(true);
  }; */
  /* const goToCreate = () => {
    setShowPrompt(true);
  }; */

  const handleYes = () => {
    if (promptType === 'create') {
      setShowPrompt(false);
      setPromptType(null);
      navigation.navigate('RecipeForm', {});
    } else if (promptType === 'delete' && recipeToDelete) {
      deleteRecipe(recipeToDelete);
      setShowPrompt(false);
      setPromptType(null);
      setRecipeToDelete(null);
      navigation.navigate('HomeTabs', { screen: 'MyRecipes' });
    }
  };

  /* const handleYes = () => {
    setShowPrompt(false);
    navigation.navigate('RecipeForm');
  }; */

  const handleNo = () => {
    setShowPrompt(false);
    setPromptType(null);
    setRecipeToDelete(null);
  };

  /* const handleNo = () => {
    setShowPrompt(false);
  }; */

  /* const goToCreate = () => {
    navigation.navigate('RecipeForm');
  }; */
  /* const goToCreate = () => {
  Alert.alert(
    '¿Desea crear una receta?',
    '',
    [
      {
        text: 'No',
        style: 'cancel',
      },
      {
        text: 'Sí',
        onPress: () => navigation.navigate('RecipeForm'),
      },
    ],
    { cancelable: true }
  );
}; */

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
                  setRecipeToDelete(item.id);
                  setPromptType('delete');
                  setShowPrompt(true);
                }}
              >

              {/* <TouchableOpacity
                onPress={() => {
                  console.log('🧪 BOTÓN ELIMINAR PRESIONADO:', item.id);
                  deleteRecipe(item.id);
                  navigation.navigate('HomeTabs', { screen: 'MyRecipes' });
                }}
              > */}

                <Ionicons name="trash-outline" size={22} color="#c00" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.button} onPress={goToCreate}>
        <Text style={styles.buttonText}>Nueva receta</Text>
      </TouchableOpacity>


      {showPrompt && (
        <View style={styles.promptOverlay}>
          <View style={styles.promptBox}>
            {promptType === 'create' ? (
              <>
                <MaterialIcons name="add-box" size={32} color="#23294c" style={{ alignSelf: 'center' }} />
                <Text style={styles.promptText}>¿Deseas crear una Receta?</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="delete-outline" size={32} color="#c00" style={{ alignSelf: 'center' }} />
                <Text style={styles.promptText}>¿Deseas eliminar la Receta?</Text>
              </>
            )}
            <View style={styles.promptButtons}>
              <TouchableOpacity style={styles.promptYes} onPress={handleYes}>
                <Text style={styles.promptYesText}>Sí</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.promptNo} onPress={handleNo}>
                <Text style={styles.promptNoText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* {showPrompt && (
        <View style={styles.promptOverlay}>
          <View style={styles.promptBox}>
            <MaterialIcons name="add-box" size={32} color="#23294c" style={{ alignSelf: 'center' }} />
            <Text style={styles.promptText}>¿Deseas crear una Receta?</Text>
            <View style={styles.promptButtons}>
              <TouchableOpacity style={styles.promptYes} onPress={handleYes}>
                <Text style={styles.promptYesText}>Sí</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.promptNo} onPress={handleNo}>
                <Text style={styles.promptNoText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )} */}

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

  promptOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  promptBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: 270,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  promptText: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 16,
    textAlign: 'center',
  },
  promptButtons: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  promptYes: {
    backgroundColor: '#23294c',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 28,
  },
  promptYesText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  promptNo: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 28,
  },
  promptNoText: {
    color: '#23294c',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MyRecipesScreen;
