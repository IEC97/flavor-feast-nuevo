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
  aprobado: boolean | null;
  imagenURL: string;
}

const AdminScreen = () => {
  const navigation = useNavigation();
  const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, []);

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

  const changeApprovalStatus = async (recipeId: number, currentStatus: boolean | null) => {
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

  const getStatusIcon = (status: boolean | null) => {
    if (status === true) return { icon: 'checkmark-circle', color: '#4CAF50', text: 'Aprobada' };
    if (status === false) return { icon: 'close-circle', color: '#F44336', text: 'Desaprobada' };
    return { icon: 'help-circle-outline', color: '#FF9800', text: 'Sin aprobar' };
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
          onPress={loadRecipes}
        >
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Estados de aprobación:</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <Ionicons name="help-circle-outline" size={16} color="#FF9800" />
            <Text style={styles.legendText}>Sin aprobar</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.legendText}>Aprobada</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="close-circle" size={16} color="#F44336" />
            <Text style={styles.legendText}>Desaprobada</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando recetas...</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.idReceta.toString()}
          renderItem={renderRecipe}
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
});

export default AdminScreen;
