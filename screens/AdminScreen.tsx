import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../constants';

interface AdminRecipe {
  idReceta: number;
  idUsuario: number;
  nombre: string;
  descripcion: string;
  fecha: string;
  porciones: number;
  idTipo: number | string;
  aprobado: boolean;
  imagenURL: string;
}

interface AdminComment {
  idComentario: number;
  descripcion: string;
  aprobado: boolean;
  idReceta: number;
  usuario: string;
  nombreReceta?: string; // Lo obtendremos por separado
}

type TabType = 'recipes' | 'comments';

const AdminScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('recipes');
  const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'recipes') {
      loadRecipes();
    } else {
      // Para comentarios, necesitamos las recetas primero
      loadCommentsWithRecipes();
    }
  }, [activeTab]);

  // Función que carga recetas primero y luego comentarios
  const loadCommentsWithRecipes = async () => {
    try {
      setLoading(true);
      
      // Si no tenemos recetas cargadas, cargarlas primero
      if (recipes.length === 0) {
        console.log('🔄 Cargando recetas admin primero para optimizar comentarios...');
        await loadRecipesForComments();
      }
      
      // Ahora cargar comentarios con la optimización
      await loadComments();
    } catch (error) {
      console.error('❌ Error en loadCommentsWithRecipes:', error);
      setLoading(false);
    }
  };

  // Función auxiliar para cargar recetas sin cambiar el estado de loading
  const loadRecipesForComments = async (): Promise<void> => {
    try {
      const endpoint = `${API_BASE_URL}/admin/recipes`;
      console.log('🔄 Cargando recetas desde:', endpoint);
      
      const response = await fetch(endpoint);
      const text = await response.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Error al parsear JSON en loadRecipesForComments:', text.substring(0, 200));
        return;
      }
      
      if (data.status === 200) {
        setRecipes(data.data);
        console.log('📋 Recetas de admin cargadas para optimización:', data.data.length);
      }
    } catch (error) {
      console.error('❌ Error al cargar recetas para comentarios:', error);
    }
  };

  // Función optimizada para obtener nombres de recetas usando las recetas de admin
  const getRecipeNamesOptimized = async (comments: AdminComment[]): Promise<AdminComment[]> => {
    // Crear un mapa de los nombres que ya tenemos de las recetas de admin
    const adminRecipeNames = new Map<number, string>();
    recipes.forEach(recipe => {
      adminRecipeNames.set(recipe.idReceta, recipe.nombre);
    });

    // Separar comentarios que ya tienen nombre en las recetas de admin vs los que necesitan fetch
    const commentsWithAdminRecipe: AdminComment[] = [];
    const commentsMissingRecipe: { comment: AdminComment; index: number }[] = [];

    comments.forEach((comment, index) => {
      if (adminRecipeNames.has(comment.idReceta)) {
        commentsWithAdminRecipe.push({
          ...comment,
          nombreReceta: adminRecipeNames.get(comment.idReceta)!
        });
      } else {
        commentsMissingRecipe.push({ comment, index });
      }
    });

    console.log(`🎯 Optimización ADMIN: ${commentsWithAdminRecipe.length} nombres obtenidos de recetas admin, ${commentsMissingRecipe.length} requieren fetch`);

    // Para los comentarios que no están en admin recipes, hacer fetch solo una vez por receta única
    const uniqueRecipeIds = [...new Set(commentsMissingRecipe.map(item => item.comment.idReceta))];
    const fetchedRecipeNames = new Map<number, string>();

    if (uniqueRecipeIds.length > 0) {
      console.log(`🔄 Haciendo fetch para ${uniqueRecipeIds.length} recetas no encontradas en admin:`, uniqueRecipeIds);
      
      const fetchPromises = uniqueRecipeIds.map(async (recipeId) => {
        try {
          const recipeResponse = await fetch(`${API_BASE_URL}/recipes/${recipeId}`);
          const recipeData = await recipeResponse.json();
          const recipeName = recipeData.status === 200 ? recipeData.data.nombre : `Receta ${recipeId}`;
          fetchedRecipeNames.set(recipeId, recipeName);
          return { recipeId, recipeName };
        } catch (error) {
          console.error(`❌ Error cargando nombre de receta ${recipeId}:`, error);
          const fallbackName = `Receta ${recipeId}`;
          fetchedRecipeNames.set(recipeId, fallbackName);
          return { recipeId, recipeName: fallbackName };
        }
      });

      await Promise.all(fetchPromises);
    }

    // Combinar todos los comentarios con sus nombres de receta
    const finalComments = [...commentsWithAdminRecipe];
    commentsMissingRecipe.forEach(({ comment }) => {
      finalComments.push({
        ...comment,
        nombreReceta: fetchedRecipeNames.get(comment.idReceta) || `Receta ${comment.idReceta}`
      });
    });

    // Ordenar por el orden original (idComentario)
    finalComments.sort((a, b) => a.idComentario - b.idComentario);

    return finalComments;
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const endpoint = `${API_BASE_URL}/admin/comentarios`;
      console.log('🔄 Cargando comentarios desde:', endpoint);
      
      const response = await fetch(endpoint);
      console.log('📡 Status de respuesta comentarios:', response.status);
      
      const text = await response.text();
      console.log('📤 Respuesta del servidor (loadComments):', text.substring(0, 200) + '...');

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Error al parsear JSON en loadComments:', text.substring(0, 200));
        Alert.alert('Error de Servidor', 'El servidor devolvió una respuesta inválida para comentarios.');
        return;
      }
      
      if (data.status === 200) {
        // Usar la función optimizada para obtener nombres de recetas
        const commentsWithRecipeNames = await getRecipeNamesOptimized(data.data);
        
        setComments(commentsWithRecipeNames);
        console.log('💬 Comentarios de admin cargados con optimización:', commentsWithRecipeNames.length);
      } else {
        console.error('❌ Error al cargar comentarios de admin:', data.message);
        Alert.alert('Error', 'No se pudieron cargar los comentarios');
      }
    } catch (error) {
      console.error('❌ Error al cargar comentarios de admin:', error);
      Alert.alert('Error', 'Error de conexión al cargar comentarios');
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const endpoint = `${API_BASE_URL}/admin/recipes`;
      console.log('🔄 Cargando recetas desde:', endpoint);
      
      const response = await fetch(endpoint);
      console.log('📡 Status de respuesta:', response.status);
      
      const text = await response.text();
      console.log('📤 Respuesta del servidor (loadRecipes):', text.substring(0, 200) + '...');

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Error al parsear JSON en loadRecipes:', text.substring(0, 200));
        Alert.alert('Error de Servidor', 'El servidor devolvió una respuesta inválida. Verifica la conexión.');
        return;
      }
      
      if (data.status === 200) {
        setRecipes(data.data);
        console.log('📋 Recetas de admin cargadas:', data.data.length);
      } else {
        console.error('❌ Error al cargar recetas de admin:', data.message);
        Alert.alert('Error', 'No se pudieron cargar las recetas');
      }
    } catch (error) {
      console.error('❌ Error al cargar recetas de admin:', error);
      Alert.alert('Error', 'Error de conexión al cargar recetas');
    } finally {
      setLoading(false);
    }
  };

  const changeApprovalStatus = async (recipeId: number, currentStatus: boolean) => {
    // Alternar entre aprobado (true) y desaprobado (false)
    const newStatus = !currentStatus;

    try {
      console.log(`🔄 Cambiando estado de aprobación de receta ${recipeId} a:`, newStatus);
      
      const endpoint = `${API_BASE_URL}/admin/recipes/${recipeId}/aprobacion`;
      console.log('📡 Usando endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: recipeId,
          aprobado: newStatus
        }),
      });

      console.log('📡 Status de respuesta:', response.status);
      const text = await response.text();
      console.log('📤 Respuesta del servidor:', text.substring(0, 200) + '...');

      if (text.includes('<!DOCTYPE html>')) {
        console.error('❌ Servidor devolvió HTML - URL o método incorrecto');
        Alert.alert(
          'Error de Endpoint', 
          `El endpoint ${endpoint} no está disponible o el método POST no está permitido. Verifica la configuración del servidor.`
        );
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Error al parsear JSON:', text.substring(0, 200));
        Alert.alert('Error', 'Respuesta inválida del servidor');
        return;
      }
      
      if (data.status === 200) {
        // Actualizar el estado local
        setRecipes(prev => 
          prev.map(recipe => 
            recipe.idReceta === recipeId 
              ? { ...recipe, aprobado: newStatus }
              : recipe
          )
        );
        
        const statusText = newStatus ? 'Aprobada' : 'Desaprobada';
        console.log(`✅ Receta ${recipeId} ${statusText.toLowerCase()}`);
        Alert.alert('Éxito', `Receta ${statusText.toLowerCase()} correctamente`);
      } else {
        console.error('❌ Error al cambiar estado:', data.message);
        Alert.alert('Error', data.message || 'No se pudo cambiar el estado de la receta');
      }
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
      Alert.alert('Error', 'Error de conexión al cambiar estado');
    }
  };

  const changeCommentApprovalStatus = async (commentId: number, currentStatus: boolean) => {
    // Alternar entre aprobado (true) y desaprobado (false)
    const newStatus = !currentStatus;

    try {
      console.log(`🔄 Cambiando estado de aprobación de comentario ${commentId} a:`, newStatus);
      
      const endpoint = `${API_BASE_URL}/admin/comentarios/${commentId}/aprobacion`;
      console.log('📡 Usando endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aprobado: newStatus
        }),
      });

      console.log('📡 Status de respuesta:', response.status);
      const text = await response.text();
      console.log('📤 Respuesta del servidor:', text.substring(0, 200) + '...');

      if (text.includes('<!DOCTYPE html>')) {
        console.error('❌ Servidor devolvió HTML - URL o método incorrecto');
        Alert.alert(
          'Error de Endpoint', 
          `El endpoint ${endpoint} no está disponible o el método POST no está permitido.`
        );
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Error al parsear JSON:', text.substring(0, 200));
        Alert.alert('Error', 'Respuesta inválida del servidor');
        return;
      }
      
      if (data.status === 200) {
        // Actualizar el estado local
        setComments(prev => 
          prev.map(comment => 
            comment.idComentario === commentId 
              ? { ...comment, aprobado: newStatus }
              : comment
          )
        );
        
        const statusText = newStatus ? 'Aprobado' : 'Desaprobado';
        console.log(`✅ Comentario ${commentId} ${statusText.toLowerCase()}`);
        Alert.alert('Éxito', `Comentario ${statusText.toLowerCase()} correctamente`);
      } else {
        console.error('❌ Error al cambiar estado del comentario:', data.message);
        Alert.alert('Error', data.message || 'No se pudo cambiar el estado del comentario');
      }
    } catch (error) {
      console.error('❌ Error al cambiar estado del comentario:', error);
      Alert.alert('Error', 'Error de conexión al cambiar estado');
    }
  };

  const getStatusIcon = (status: boolean) => {
    if (status === true) return { icon: 'checkmark-circle', color: '#4CAF50', text: 'Aprobada' };
    return { icon: 'close-circle', color: '#F44336', text: 'Desaprobada' };
  };

  const getCommentStatusIcon = (status: boolean) => {
    if (status === true) return { icon: 'checkmark-circle', color: '#4CAF50', text: 'Aprobado' };
    return { icon: 'close-circle', color: '#F44336', text: 'Desaprobado' };
  };

  const renderComment = ({ item }: { item: AdminComment }) => {
    const statusInfo = getCommentStatusIcon(item.aprobado);
    
    return (
      <View style={styles.commentCard}>
        <View style={styles.commentInfo}>
          <Text style={styles.commentText}>{item.descripcion}</Text>
          <Text style={styles.commentRecipe}>
            📄 {item.nombreReceta} (ID: {item.idReceta})
          </Text>
          <Text style={styles.commentUser}>
            👤 {item.usuario}
          </Text>
          <Text style={styles.commentId}>
            ID Comentario: {item.idComentario}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: statusInfo.color }]}
          onPress={() => changeCommentApprovalStatus(item.idComentario, item.aprobado)}
        >
          <Ionicons name={statusInfo.icon as any} size={24} color="white" />
          <Text style={styles.statusText}>{statusInfo.text}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRecipe = ({ item }: { item: AdminRecipe }) => {
    const statusInfo = getStatusIcon(item.aprobado);
    
    return (
      <View style={styles.recipeCard}>
        <Image 
          source={{ uri: item.imagenURL }} 
          style={styles.recipeImage}
          defaultSource={require('../assets/placeholder.jpg')}
        />
        
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName}>{item.nombre}</Text>
          <Text style={styles.recipeDescription} numberOfLines={2}>
            {item.descripcion}
          </Text>
          <Text style={styles.recipeDetails}>
            ID: {item.idReceta} | Usuario: {item.idUsuario} | Porciones: {item.porciones}
          </Text>
          <Text style={styles.recipeDate}>
            {new Date(item.fecha).toLocaleDateString()}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: statusInfo.color }]}
          onPress={() => changeApprovalStatus(item.idReceta, item.aprobado)}
        >
          <Ionicons name={statusInfo.icon as any} size={24} color="white" />
          <Text style={styles.statusText}>{statusInfo.text}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.title}>🔐 Administrador</Text>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => activeTab === 'recipes' ? loadRecipes() : loadComments()}
        >
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recipes' && styles.activeTab]}
          onPress={() => setActiveTab('recipes')}
        >
          <Ionicons 
            name="restaurant-outline" 
            size={20} 
            color={activeTab === 'recipes' ? '#fff' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'recipes' && styles.activeTabText]}>
            Recetas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'comments' && styles.activeTab]}
          onPress={() => setActiveTab('comments')}
        >
          <Ionicons 
            name="chatbubble-outline" 
            size={20} 
            color={activeTab === 'comments' ? '#fff' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'comments' && styles.activeTabText]}>
            Comentarios
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Estados de aprobación:</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.legendText}>Aprobado</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="close-circle" size={16} color="#F44336" />
            <Text style={styles.legendText}>Desaprobado</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#13162e" />
          <Text style={styles.loadingText}>
            {activeTab === 'recipes' ? 'Cargando recetas...' : 'Cargando comentarios...'}
          </Text>
        </View>
      ) : activeTab === 'recipes' ? (
        <FlatList
          data={recipes}
          keyExtractor={(item, index) => `admin-recipe-${item.idReceta}-${index}`}
          renderItem={renderRecipe}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item, index) => `admin-comment-${item.idComentario}-${index}`}
          renderItem={renderComment}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  legend: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  recipeImage: {
    width: 80,
    height: 80,
  },
  recipeInfo: {
    flex: 1,
    padding: 12,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  recipeDetails: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  recipeDate: {
    fontSize: 11,
    color: '#999',
  },
  statusButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    minWidth: 80,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  // Estilos para pestañas
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f8f8',
  },
  activeTab: {
    backgroundColor: '#13162e',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: 'white',
  },
  // Estilos para comentarios
  commentCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  commentInfo: {
    flex: 1,
    padding: 12,
  },
  commentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  commentRecipe: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  commentId: {
    fontSize: 11,
    color: '#999',
  },
});

export default AdminScreen;
