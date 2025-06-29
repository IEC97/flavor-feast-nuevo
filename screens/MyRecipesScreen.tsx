import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Agrega este import
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Recipe } from '../types';
import { useRecipeContext } from '../context/RecipeContext';
import { useUserContext } from '../context/UserContext';
//import { useFilterContext } from '../context/FilterContext';

const MyRecipesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'RecipeForm'>>();
  const { deleteRecipe, getUserRecipes } = useRecipeContext();
  const { user } = useUserContext();

  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptType, setPromptType] = useState<'create' | 'delete' | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);

  // Cargar las recetas del usuario desde la base de datos
  useEffect(() => {
    const loadUserRecipes = async () => {
      if (!user?.id) {
        console.log('⚠️ No hay usuario autenticado');
        setLoading(false);
        return;
      }

      try {
        console.log('👤 Cargando recetas del usuario:', user.id);
        setLoading(true);
        const recipes = await getUserRecipes(user.id);
        console.log('✅ Recetas del usuario cargadas:', recipes.length);
        setUserRecipes(recipes);
      } catch (error) {
        console.error('❌ Error al cargar recetas del usuario:', error);
        setUserRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserRecipes();
  }, [user?.id, getUserRecipes]);

  // Refrescar recetas cuando la pantalla esté en foco (después de crear/editar)
  useFocusEffect(
    React.useCallback(() => {
      const refreshUserRecipes = async () => {
        if (user?.id && !loading) {
          console.log('🔄 Refrescando recetas del usuario al regresar a la pantalla');
          try {
            const recipes = await getUserRecipes(user.id);
            setUserRecipes(recipes);
            console.log('✅ Lista de recetas actualizada:', recipes.length, 'recetas');
          } catch (error) {
            console.error('❌ Error al refrescar recetas:', error);
          }
        }
      };

      // Pequeño delay para asegurar que la actualización del backend se haya completado
      const timeoutId = setTimeout(refreshUserRecipes, 500);
      return () => clearTimeout(timeoutId);
    }, [user?.id, getUserRecipes, loading])
  );

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

  const handleYes = async () => {
    if (promptType === 'create') {
      setShowPrompt(false);
      setPromptType(null);
      navigation.navigate('RecipeForm', {});
    } else if (promptType === 'delete' && recipeToDelete) {
      try {
        console.log('🗑️ Intentando eliminar receta:', recipeToDelete);
        // Eliminar de la base de datos
        const success = await deleteRecipe(recipeToDelete);
        if (success) {
          // Eliminar de la lista local también
          setUserRecipes(prev => prev.filter(recipe => recipe.id !== recipeToDelete));
          console.log('✅ Receta eliminada exitosamente:', recipeToDelete);
          Alert.alert('Éxito', 'Receta eliminada correctamente');
        } else {
          console.error('❌ Error al eliminar receta del backend');
          Alert.alert('Error', 'No se pudo eliminar la receta. Inténtalo de nuevo.');
        }
      } catch (error) {
        console.error('❌ Error al eliminar receta:', error);
        Alert.alert('Error', 'Ocurrió un error al eliminar la receta');
      }
      setShowPrompt(false);
      setPromptType(null);
      setRecipeToDelete(null);
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#23294c" />
          <Text style={styles.loadingText}>Cargando tus recetas...</Text>
        </View>
      ) : !user ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Debes iniciar sesión para ver tus recetas</Text>
        </View>
      ) : userRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aún no has creado ninguna receta</Text>
          <Text style={styles.emptySubtext}>¡Crea tu primera receta!</Text>
        </View>
      ) : (
        <FlatList
          data={userRecipes}
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
                  <Ionicons name="trash-outline" size={22} color="#c00" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
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
