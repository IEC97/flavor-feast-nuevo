import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants';
import { useUserContext } from '../context/UserContext';
import { Comment, Rating } from '../types';
import StarRating from './StarRating';
import LoadingSpinner from './LoadingSpinner';
import { CustomAlert } from './CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface RatingCommentsProps {
  recipeId: string;
  currentRating: number;
  idAutor: number;
  onRatingUpdate?: (newRating: number, voteCount: number) => void;
  ratingsWithComments?: any;
  userRating?: number;
  isOwnRecipe?: boolean;
}

const RatingComments: React.FC<RatingCommentsProps> = ({ 
  recipeId, 
  currentRating, 
  idAutor,
  onRatingUpdate,
  ratingsWithComments,
  userRating: initialUserRating = 0,
  isOwnRecipe = false
}) => {
  const { user } = useUserContext();
  const { alertState, hideAlert, showAlert } = useCustomAlert();
  const [comments, setComments] = useState<Comment[]>([]);
  const [userRating, setUserRating] = useState<number>(initialUserRating);
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [ratingInfo, setRatingInfo] = useState<{promedio: number, cantidadVotos: number}>({
    promedio: currentRating,
    cantidadVotos: 0
  });
  const [comentarios, setComentarios] = useState([]);

  useEffect(() => {
    if (ratingsWithComments) {
      // Usar datos de puntuación pasados como props
      setRatingInfo({
        promedio: ratingsWithComments.promedio,
        cantidadVotos: ratingsWithComments.cantidadVotos
      });
      
      // Procesar comentarios con puntuaciones
      if (ratingsWithComments.comentarios) {
        loadCommentsWithRatings(ratingsWithComments.comentarios);
      }
    } else {
      // Fallback a la carga tradicional
      loadComments();
      loadRatingInfo();
    }
    
    if (user?.id) {
      setUserRating(initialUserRating);
    }
  }, [recipeId, user?.id, ratingsWithComments, initialUserRating]);

  const loadCommentsWithRatings = async (commentRatings: any[]) => {
    try {
      console.log('🔍 Cargando comentarios con puntuaciones para receta:', recipeId);
      
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/comentario`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      
      if (json.status === 200 && json.data) {
        // Mapear comentarios con sus puntuaciones
        const recentComments = json.data
          .reverse().slice(0, 10)
          .map((c: any) => {
            // Buscar la puntuación para este comentario
            const ratingData = commentRatings.find(
              (rating: any) => rating.idComentario === c.idComentario
            );
            
            return {
              id: c.idComentario,
              description: c.descripcion,
              approved: true,
              username: c.usuario || 'Usuario anónimo',
              createdAt: c.fechaCreacion,
              rating: ratingData ? ratingData.puntuacion : null
            };
          });
        
        setComments(recentComments);
        console.log('✅ Comentarios cargados con puntuaciones:', recentComments.length);
      }
    } catch (error) {
      console.error('❌ Error al cargar comentarios con puntuaciones:', error);
      // Fallback a carga tradicional
      loadComments();
    }
  };

  const loadRatingInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/puntuacion`);
      
      if (!response.ok) {
        console.error('❌ Error en respuesta de valoración:', response.status, response.statusText);
        return;
      }
      
      const text = await response.text();
      let json;
      
      try {
        json = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Error al parsear JSON de valoración:', parseError);
        console.error('❌ Respuesta recibida:', text.substring(0, 200));
        return;
      }
      
      if (json.status === 200 && json.data) {
        setRatingInfo({
          promedio: json.data.promedio || 0,
          cantidadVotos: json.data.cantidadVotos || 0
        });
      }
    } catch (error) {
      console.error('❌ Error al cargar información de valoración:', error);
    }
  };

  const loadComments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/comentario`);
      
      if (!response.ok) {
        console.error('❌ Error en respuesta de comentarios:', response.status, response.statusText);
        return;
      }
      
      const text = await response.text();
      let json;
      
      try {
        json = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Error al parsear JSON de comentarios:', parseError);
        console.error('❌ Respuesta recibida:', text.substring(0, 200));
        return;
      }
      
      if (json.status === 200 && json.data) {
        // Tomar solo los últimos 10 comentarios
        const recentComments = json.data
          .reverse().slice(0, 10)
          .map((c: any) => ({
            id: c.idComentario,
            description: c.descripcion,
            approved: true,
            username: c.usuario || 'Usuario anónimo',
            createdAt: c.fechaCreacion,
            rating: typeof c.puntuacion === 'number' ? c.puntuacion : null
          }));
        setComments(recentComments);
      }
    } catch (error) {
      console.error('❌ Error al cargar comentarios:', error);
    }
  };

  const loadUserRating = async () => {
    try {
      // En lugar de cargar la valoración específica del usuario, 
      // vamos a asumir que no tenemos endpoint específico para eso
      // El usuario podrá siempre valorar/re-valorar
      setUserRating(0);
    } catch (error) {
      console.error('❌ Error al cargar valoración del usuario:', error);
    }
  };

  const submitRating = async (rating: number) => {
    if (!user?.id) {
      Alert.alert('Error', 'Debes iniciar sesión para valorar');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idUsuario: parseInt(user.id),
          puntuacion: rating,
        }),
      });

      if (!response.ok) {
        console.error('❌ Error en respuesta de valoración:', response.status, response.statusText);
        Alert.alert('Error', 'Error al enviar valoración');
        return;
      }

      const text = await response.text();
      let json;
      
      try {
        json = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Error al parsear JSON de valoración:', parseError);
        console.error('❌ Respuesta recibida:', text.substring(0, 200));
        Alert.alert('Error', 'Error en la respuesta del servidor');
        return;
      }

      if (json.status === 200 || json.status === 201) {
        setUserRating(rating);
        // Recargar la información de valoración después de valorar
        const updatedResponse = await fetch(`${API_BASE_URL}/recipes/${recipeId}/puntuacion`);
        
        if (updatedResponse.ok) {
          const updatedText = await updatedResponse.text();
          try {
            const updatedJson = JSON.parse(updatedText);
            if (updatedJson.status === 200 && updatedJson.data) {
              const newRatingInfo = {
                promedio: updatedJson.data.promedio || 0,
                cantidadVotos: updatedJson.data.cantidadVotos || 0
              };
              setRatingInfo(newRatingInfo);
              onRatingUpdate?.(newRatingInfo.promedio, newRatingInfo.cantidadVotos);
            }
          } catch (parseError) {
            console.error('❌ Error al parsear JSON de valoración actualizada:', parseError);
          }
        }
        
        showAlert(
          'Valoración guardada',
          'Tu valoración ha sido guardada exitosamente',
          [{ text: 'OK' }],
          '⭐'
        );
      } else {
        console.error('❌ Error al guardar valoración:', json.message);
        Alert.alert('Error', json.message || 'Error al guardar valoración');
      }
    } catch (error) {
      console.error('❌ Error al enviar valoración:', error);
      Alert.alert('Error', 'Error de conexión al enviar valoración');
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Debes iniciar sesión para comentar');
      return;
    }

    if (isOwnRecipe) {
      Alert.alert('Error', 'No puedes comentar tu propia receta');
      return;
    }

    if (!newComment.trim()) {
      Alert.alert('Error', 'Escribe un comentario');
      return;
    }

    // Verificar que el usuario haya valorado antes de comentar
    if (userRating === 0) {
      Alert.alert('Error', 'Debes valorar la receta antes de comentar');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idUsuario: parseInt(user.id),
          comentario: newComment.trim(),
        }),
      });

      if (!response.ok) {
        console.error('❌ Error en respuesta de comentario:', response.status, response.statusText);
        Alert.alert('Error', 'Error al enviar comentario');
        return;
      }

      const text = await response.text();
      let json;
      
      try {
        json = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Error al parsear JSON de comentario:', parseError);
        console.error('❌ Respuesta recibida:', text.substring(0, 200));
        Alert.alert('Error', 'Error en la respuesta del servidor');
        return;
      }

      if (json.status === 200 || json.status === 201) {
        setNewComment('');
        loadComments(); // Recargar comentarios
        showAlert(
          'Comentario enviado',
          'Tu comentario ha sido enviado exitosamente y está pendiente de validación por el administrador.',
          [{ text: 'Entendido' }],
          '💬'
        );
      } else {
        Alert.alert('Error', json.message || 'Error al enviar comentario');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
      console.error('❌ Error al enviar comentario:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, onPress?: (rating: number) => void, size: number = 20) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress?.(star)}
            disabled={!onPress}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color={star <= rating ? '#f39c12' : '#ddd'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && <LoadingSpinner overlay text="Procesando..." />}
      
      {/* Valoración del usuario */}
      {user && (
        <View style={styles.userRating}>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>
              {isOwnRecipe ? 'Tu receta:' : 'Tu valoración:'}
            </Text>
            {isOwnRecipe ? (
              <Text style={styles.ownRecipeText}>No puedes valorar tu propia receta</Text>
            ) : (
              renderStars(userRating, submitRating, 24)
            )}
          </View>
          {!isOwnRecipe && userRating > 0 && (
            <Text style={styles.userRatingText}>Has valorado con {userRating} estrellas</Text>
          )}
        </View>
      )}

      {/* Comentarios existentes */}
      <View style={styles.commentsSection}>
        <Text style={styles.commentsTitle}>Últimos comentarios:</Text>
        {comments.length === 0 ? (
          <Text style={styles.noComments}>No hay comentarios aún</Text>
        ) : (
          comments.map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.commentAuthor}>{comment.username}</Text>
                {comment.rating !== null && comment.rating !== undefined && (
                  <StarRating rating={comment.rating} size={16} />
                )}
              </View>
              <Text style={styles.commentText}>{comment.description}</Text>
            </View>
          ))
        )}
      </View>

      {/* Agregar nuevo comentario */}
      {user && (
        <View style={styles.addComment}>
          <Text style={styles.addCommentTitle}>Agregar comentario:</Text>
          {userRating === 0 && (
            <Text style={styles.warningText}>
              ⚠️ Debes valorar la receta antes de comentar
            </Text>
          )}
          <TextInput
            style={[
              styles.commentInput,
              userRating === 0 && styles.commentInputDisabled
            ]}
            placeholder={userRating === 0 ? "Primero valora la receta..." : "Escribe tu comentario aquí..."}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={userRating > 0}
          />
          <TouchableOpacity
            style={[
              styles.submitButton, 
              (loading || !newComment.trim() || userRating === 0) && styles.submitButtonDisabled
            ]}
            onPress={submitComment}
            disabled={loading || !newComment.trim() || userRating === 0}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Enviando...' : 'Enviar comentario'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!user && (
        <Text style={styles.loginPrompt}>
          Inicia sesión para valorar y comentar
        </Text>
      )}

      {/* CustomAlert para alertas estilizadas */}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        icon={alertState.icon}
        onClose={hideAlert}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  averageRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userRating: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userRatingText: {
    fontSize: 12,
    color: '#27ae60',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  ratingText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 8,
  },
  ratingValue: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  commentsSection: {
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  noComments: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    padding: 16,
  },
  commentCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  addComment: {
    marginTop: 8,
  },
  addCommentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#e74c3c',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 12,
    color: '#000', // Texto negro
  },
  commentInputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#bbb',
  },
  submitButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loginPrompt: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 16,
  },
  ownRecipeText: {
    fontSize: 14,
    color: '#856404',
    fontStyle: 'italic',
    flex: 1,
  },
});

export default RatingComments;
