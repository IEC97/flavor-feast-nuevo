// ✅ context/RecipeContext.tsx - CORREGIDO
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Recipe, AvailableIngredient } from '../types';
import { API_BASE_URL } from '../constants'; 
import { useUserContext } from './UserContext';

export type RootStackParamList = {
  HomeTabs: undefined;
  RecipeDetails: { recipe: Recipe };
};

type RecipeContextType = {
  recipes: Recipe[];
  myRecipes: Recipe[];
  favorites: Recipe[];
  addRecipe: (recipe: Recipe) => Promise<void>;
  editRecipe: (id: string, updatedRecipe: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<boolean>;
  toggleFavorite: (recipe: Recipe) => void;
  isFavorite: (id: string) => boolean;
  refreshFavorites: () => Promise<void>;
  getRecipeIngredients: (recipeId: string) => Promise<any[]>;
  getRecipeSteps: (recipeId: string) => Promise<any[]>;
  getRecipeDetails: (recipeId: string) => Promise<Recipe | null>;
  getAvailableIngredients: () => Promise<AvailableIngredient[]>;
  getUserRecipes: (userId: string) => Promise<Recipe[]>;
  refreshUserRecipesStatus: () => Promise<Recipe[]>;
  getRecipeAverageRating: (recipeId: string) => Promise<number>;
  clearFavorites: () => void;
};

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const useRecipeContext = () => {
  const context = useContext(RecipeContext);
  if (!context) throw new Error('useRecipeContext must be used inside RecipeProvider');
  return context;
};

//Endpoint del backend
const API_URL = (`${API_BASE_URL}/recipes`);


export const RecipeProvider = ({ children }: { children: React.ReactNode }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);

  const clearFavorites = () => {
    setFavorites([]);
  };

  const { user } = useUserContext();
  const idUsuario = user?.id;

  const myRecipes = recipes.filter((r) => r.createdByUser);

    // Obtener recetas del backend
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await fetch(API_URL);
        const json = await response.json();

        if (json.status === 200 && Array.isArray(json.data)) {
          const mapped = json.data.map((r: any): Recipe => ({
            id: r.idReceta.toString(), // Asegurar que sea string
            title: r.nombre,
            author: r.usuario || (r.idUsuario === user?.id ? (user?.username || user?.email) : 'Desconocido'),
            rating: r.puntuacion || 5,
            category: r.tipo || 'Sin categoría',
            image: r.imagen ? { uri: r.imagen } : require('../assets/placeholder.jpg'),
            ingredients: r.ingredientes?.map((i: any) => ({
              name: i.nombre,
              quantity: i.cantidad,
              unit: i.unidad,
            })) || [],
            steps: r.pasos?.map((p: any) => ({
              description: p.descripcion,
              image: p.multimedia ? { uri: p.multimedia } : null,
              imageUrl: p.multimedia || '',
            })) || [],
            createdByUser: false, // Se actualizará más tarde cuando tengamos el usuario
            createdAt: r.fechaCreacion ? new Date(r.fechaCreacion).getTime() : Date.now(),
            categoryId: r.tipoId,
            servings: r.porciones,
            userId: r.idUsuario, // Guardamos el ID del usuario para comparar después
            description: r.descripcion || '', // Agregamos la descripción
          }));

          // Debug: Verificar si las descripciones están llegando
          console.log('🔍 Verificando descripciones en mapeo:', mapped.slice(0, 3).map((r: Recipe) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            descripcionOriginal: json.data.find((orig: any) => orig.idReceta.toString() === r.id)?.descripcion
          })));

          // console.log('✅ Recetas cargadas:', mapped.length); // Comentado para evitar duplicados
          setRecipes(mapped);
        } else {
          console.error('Error al cargar recetas:', json.message);
        }
      } catch (error) {
        console.error('Error al conectar con el backend:', error);
      }
    };

    fetchRecipes();
  }, []);

  
  useEffect(() => {
    if (user?.id) {
      const loadFavorites = async () => {
        const favs = await getFavoritesFromBackend(user.id);
        setFavorites(favs);
      };
      loadFavorites();
    }
  }, [user?.id]);

  // Limpiar favoritos cuando el usuario se desloguea
  useEffect(() => {
    if (!user?.id) {
      console.log('🧹 Usuario deslogueado, limpiando favoritos...');
      setFavorites([]);
    }
  }, [user?.id]);


  // Actualizar createdByUser cuando el usuario esté disponible
  useEffect(() => {
    if (user?.id) {
      const loadUserRecipesAndMark = async () => {
        try {
          const userRecipes = await getUserRecipes(user.id);
          console.log('✅ Recetas del usuario:', userRecipes.length);
          
          setRecipes(prev => {
            const userRecipeIds = new Set(userRecipes.map(r => r.id.toString()));
            const existingRecipeIds = new Set(prev.map(r => r.id.toString()));
            const recipesToAdd = userRecipes.filter(ur => !existingRecipeIds.has(ur.id.toString()));
            
            const updated = prev.map(recipe => {
              const recipeIdStr = recipe.id.toString();
              const isCreatedByUser = userRecipeIds.has(recipeIdStr);
              return {
                ...recipe,
                createdByUser: isCreatedByUser,
                userId: isCreatedByUser ? parseInt(user.id, 10) : recipe.userId
              };
            });
            
            const finalRecipes = [...updated, ...recipesToAdd];
            
            return finalRecipes;
          });
        } catch (error) {
          console.error('❌ Error al cargar recetas del usuario:', error);
        }
      };
      
      loadUserRecipesAndMark();
    }
  }, [user?.id, recipes.length]);

  const addRecipe = async (recipe: Recipe) => {
    if (!user?.id) {
      throw new Error('No hay usuario autenticado');
    }

    // Validar que categoryId sea válido
    if (!recipe.categoryId || isNaN(recipe.categoryId)) {
      throw new Error('categoryId es requerido y debe ser un número válido');
    }

    // Transforma el objeto al formato esperado por el backend
    const backendRecipe = {
      idUsuario: parseInt(user.id, 10),
      nombre: recipe.title,
      descripcion: recipe.description || '', // Valor por defecto si no hay descripción
      // Si hay imagen seleccionada, usa su URL; si no, usa una URL de placeholder
      imagen: (recipe.image && typeof recipe.image === 'object' && 'uri' in recipe.image) 
        ? recipe.image.uri 
        : 'https://via.placeholder.com/300x200.png?text=Receta',
      tipoId: recipe.categoryId,
      porciones: recipe.servings || 1, // Valor por defecto si no hay porciones
      ingredientes: recipe.ingredients.map(i => ({
        idIngrediente: i.id || 1, // Usa el ID del ingrediente
        cantidad: i.quantity,
        unidad: i.unit || '', // Valor por defecto si no hay unidad
      })),
      pasos: recipe.steps.map(s => ({
        descripcion: s.description || s.text || '',
        multimedia: s.imageUrl || (s.image && typeof s.image === 'object' && 'uri' in s.image ? s.image.uri : ''),
      })),
    };
    
    try {
      console.log('🚀 Enviando receta al backend:', backendRecipe);
      
      const response = await fetch(
        `${API_BASE_URL}/recipes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backendRecipe),
        }
      );
      
      if (!response.ok) {
        console.error('❌ Error en la respuesta del backend:', response.status, response.statusText);
        throw new Error(`Error del servidor: ${response.status}`);
      }
      
      const json = await response.json();
      console.log('📝 Respuesta completa del backend:', json);

      const statusCode = Number(json.status);

      // Casos específicos basados en la respuesta del backend
      if (statusCode === 201 && json.data && json.message === "Receta creada correctamente") {
        // CASO 1: CREACIÓN EXITOSA
        console.log('✅ Receta guardada:', json.message);
        
        // Asegurar que tenemos el ID correcto del backend
        const backendId = json.data.idReceta || json.data.id;
        if (!backendId) {
          console.error('❌ Error: El backend no devolvió un ID válido para la receta');
          console.error('📋 Datos recibidos:', json.data);
          throw new Error('El backend no devolvió un ID válido para la receta');
        }
        
        console.log('📋 ID asignado por el backend:', backendId);
        
        // Crear la receta con el ID del backend y marcarla como creada por el usuario
        const newRecipeWithBackendId = {
          ...recipe,
          id: backendId.toString(),
          createdByUser: true,
          userId: parseInt(user.id, 10),
          createdAt: Date.now()
        };
        
        setRecipes((prev) => [
          ...prev,
          newRecipeWithBackendId,
        ]);
        
        console.log('✅ Receta agregada al estado local con ID del backend:', backendId);
      } else if (statusCode === 200 && json.data && json.message === "Receta actualizada correctamente") {
        // CASO 2: EDICIÓN EXITOSA (cuando se actualiza una receta existente)
        console.log('✅ Receta actualizada:', json.message);
        
        const backendId = json.data.idReceta || json.data.id;
        if (!backendId) {
          throw new Error('El backend no devolvió un ID válido para la actualización');
        }
        
        console.log('📋 ID asignado por el backend:', backendId);
        
        // Actualizar la receta en el estado local
        setRecipes((prev) => {
          const updated = prev.map(r => 
            r.id === backendId.toString() || r.id === recipe.id 
              ? { ...r, ...recipe, id: backendId.toString() }
              : r
          );
          
          // Si no se encontró la receta para actualizar, agregarla
          const exists = updated.some(r => r.id === backendId.toString());
          if (!exists) {
            const newRecipe = {
              ...recipe,
              id: backendId.toString(),
              createdByUser: true,
              userId: parseInt(user.id, 10),
              createdAt: Date.now()
            };
            updated.push(newRecipe);
          }
          
          return updated;
        });
        
        console.log('✅ Receta actualizada en el estado local con ID del backend:', backendId);
      } else if (statusCode >= 400 && statusCode < 500) {
        // CASO 3: ERROR EN CREACIÓN/EDICIÓN
        console.error('❌ Error al crear/editar receta - Status:', statusCode);
        console.error('❌ Mensaje del backend:', json.message);
        console.error('❌ Datos devueltos:', json.data);
        
        // Lanzar error específico basado en el mensaje del backend
        if (json.message.includes('URL de imagen inválida')) {
          throw new Error('IMAGEN_INVALIDA');
        } else if (json.message.includes('ingrediente')) {
          throw new Error('INGREDIENTE_INVALIDO');
        } else if (json.message.includes('paso')) {
          throw new Error('PASO_INVALIDO');
        } else {
          throw new Error('ERROR_VALIDACION');
        }
      } else {
        // CASO GENERAL: Otros errores no especificados
        console.error('❌ Error inesperado - Status:', statusCode);
        console.error('❌ Mensaje del backend:', json.message);
        throw new Error('ERROR_GENERAL');
      }

    } catch (error) {
      console.error('Error al conectar con el backend:', error);
      // Re-lanzar la excepción para que sea capturada por handleSave
      throw error;
    }
  };

  const editRecipe = async (id: string, updated: Partial<Recipe>) => {
    try {
      console.log('🔧 Iniciando editRecipe para ID:', id);
      console.log('📝 Datos a actualizar:', {
        title: updated.title,
        description: updated.description,
        ingredientsCount: updated.ingredients?.length || 0,
        stepsCount: updated.steps?.length || 0,
        servings: updated.servings,
        categoryId: updated.categoryId,
      });
      
      // NUEVO: Forzar actualización del estado de recetas del usuario
      console.log('🔄 Forzando actualización de estado de recetas del usuario...');
      const updatedRecipes = await refreshUserRecipesStatus();
      
      // DEBUG: Mostrar todas las recetas disponibles DESPUÉS de la actualización
      console.log('🔍 Total recetas en estado (después de refresh):', updatedRecipes.length);
      
      setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));

      let recipeToEdit = updatedRecipes.find((r) => r.id === id);
      console.log('📋 Receta encontrada para editar (después de refresh):', recipeToEdit?.title);
      console.log('👤 Usuario autenticado:', user?.id);
      console.log('🔐 Creada por usuario (después de refresh):', recipeToEdit?.createdByUser);
      
      // Si no se encuentra la receta, intentar cargarla desde getUserRecipes
      if (!recipeToEdit && user?.id) {
        console.log('⚠️ Receta no encontrada en estado local, intentando cargar desde getUserRecipes...');
        try {
          const userRecipes = await getUserRecipes(user.id);
          const userRecipe = userRecipes.find(r => r.id === id || r.id.toString() === id);
          if (userRecipe) {
            console.log('✅ Receta encontrada en getUserRecipes:', userRecipe.title);
            // Agregar la receta al estado local
            setRecipes(prev => {
              const exists = prev.some(r => r.id === userRecipe.id);
              return exists ? prev : [...prev, userRecipe];
            });
            console.log('🔄 Receta agregada al estado local');
            recipeToEdit = userRecipe;
          }
        } catch (error) {
          console.error('❌ Error al cargar recetas del usuario:', error);
        }
      }
      
      if (recipeToEdit?.createdByUser && user?.id) {
        console.log('✅ Validación pasada: receta creada por usuario y usuario autenticado');
        
        // Construir camposModificados
        const camposModificados: any = {};

        // Campos básicos - incluir solo si cambiaron
        if (updated.title && updated.title !== recipeToEdit.title) {
          camposModificados.nombre = updated.title;
        }
        if (updated.description && updated.description !== recipeToEdit.description) {
          camposModificados.descripcion = updated.description;
        }
        if (updated.image && typeof updated.image === 'object' && 'uri' in updated.image && 
            updated.image.uri !== (recipeToEdit.image && typeof recipeToEdit.image === 'object' && 'uri' in recipeToEdit.image ? recipeToEdit.image.uri : '')) {
          camposModificados.imagen = updated.image.uri;
        }
        if (
          typeof updated.servings === 'number' &&
          updated.servings !== recipeToEdit.servings
        ) {
          camposModificados.porciones = updated.servings;
        }
        if (
          typeof updated.categoryId === 'number' &&
          updated.categoryId !== recipeToEdit.categoryId
        ) {
          camposModificados.tipoId = updated.categoryId;
        }

        // Fecha de creación - incluir siempre si es válida
        if (recipeToEdit.createdAt && !isNaN(recipeToEdit.createdAt)) {
          const fecha = new Date(recipeToEdit.createdAt).toISOString().split('T')[0];
          if (fecha !== 'Invalid Date' && fecha !== '1970-01-01') {
            camposModificados.fechaCreacion = fecha;
          }
        } else {
          // Si no hay fecha válida, usar la fecha actual
          camposModificados.fechaCreacion = new Date().toISOString().split('T')[0];
        }
        
        // Ingredientes - SIEMPRE incluir si están presentes en updated
        if (updated.ingredients && Array.isArray(updated.ingredients)) {
          console.log('🥕 Actualizando ingredientes:', updated.ingredients.length, 'ingredientes');
          camposModificados.ingredientes = updated.ingredients.map((i) => ({
            idIngrediente: i.id || 1,
            cantidad: i.quantity || 0,
            unidad: i.unit || 'gramos',
          }));
        }
        
        // Pasos - VOLVER A INCLUIR para probar con logging detallado
        if (updated.steps && Array.isArray(updated.steps)) {
          console.log('📝 Actualizando pasos:', updated.steps.length, 'pasos');
          console.log('📝 Verificando estructura de pasos...');
          updated.steps.forEach((s, index) => {
            console.log(`  Paso ${index + 1}: ${s.description || s.text || 'Sin descripción'}`);
          });
          
          camposModificados.pasos = updated.steps.map((s, index) => ({
            descripcion: s.description || s.text || '',
            multimedia: s.imageUrl || (s.image && typeof s.image === 'object' && 'uri' in s.image ? s.image.uri : ''),
          }));
          console.log('📝 Pasos procesados para envío al backend');
          console.log('🚨 ENVIANDO PASOS - verificar si el backend duplica la receta');
        }

        // Si no hay cambios, no mandamos nada
        if (Object.keys(camposModificados).length === 0) {
          console.log('⚠️ No hay cambios para actualizar');
          return;
        }

        console.log('📦 Campos modificados finales:', camposModificados);

        const body = {
          id: id.toString(),
          idUsuario: parseInt(user.id, 10),
          camposModificados,
        };

        try {
          // ARREGLO: Usar query parameters correctos como en Postman
          const url = `${API_BASE_URL}/recipes/${id}&method=PUT`;
          console.log('🔄 Enviando PUT a:', url);
          console.log('📦 Body con', Object.keys(camposModificados).length, 'campos modificados');
          
          const res = await fetch(url, {
            method: 'POST', // POST con query parameters como en Postman
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          
          if (!res.ok) {
            console.error('❌ Respuesta no exitosa:', res.status, res.statusText);
            const errorText = await res.text();
            console.error('❌ Texto de error:', errorText);
            throw new Error(`Error del servidor: ${res.status}`);
          }
          
          const contentType = res.headers.get('content-type');
          console.log('📋 Content-Type:', contentType);
          
          let json;
          if (contentType && contentType.includes('application/json')) {
            json = await res.json();
          } else {
            const responseText = await res.text();
            console.log('📄 Respuesta como texto:', responseText);
            try {
              json = JSON.parse(responseText);
            } catch (parseError) {
              console.error('❌ No se pudo parsear como JSON:', parseError);
              throw new Error('Error al procesar respuesta del servidor');
            }
          }
          
          console.log('📝 Respuesta actualización:', json);
          
          if (json.status >= 200 && json.status < 300) {
            console.log('✅ Receta actualizada exitosamente');
            
            // NUEVO: Verificar si se devolvió un ID diferente (indicaría duplicación)
            if (json.data && json.data.idReceta && json.data.idReceta.toString() !== id) {
              console.warn('⚠️ ADVERTENCIA: El backend devolvió un ID diferente!');
              console.warn('📋 ID original:', id);
              console.warn('📋 ID devuelto:', json.data.idReceta);
              console.warn('🚨 Esto indica que se creó una nueva receta en lugar de actualizar');
              console.warn('💡 POSIBLE SOLUCIÓN: El backend tiene un bug al actualizar pasos');
            } else {
              console.log('✅ ID correcto devuelto - no hubo duplicación');
            }
          } else {
            console.error('❌ Error en la actualización:', json.message);
            // Lanzar error específico basado en el mensaje del backend
            if (json.message.includes('URL de imagen inválida')) {
              throw new Error('IMAGEN_INVALIDA');
            } else if (json.message.includes('ingrediente')) {
              throw new Error('INGREDIENTE_INVALIDO');
            } else if (json.message.includes('paso')) {
              throw new Error('PASO_INVALIDO');
            } else {
              throw new Error('ERROR_VALIDACION');
            }
          }
          
        } catch (error) {
          console.error('❌ Error actualizando receta en backend:', error);
          // Re-lanzar el error para que sea capturado por handleSave
          throw error;
        }
      } else {
        console.log('⚠️ No se puede editar: receta no creada por usuario o usuario no autenticado');
        throw new Error('No se puede editar: receta no creada por usuario');
      }
    } catch (error) {
      console.error('❌ Error general en editRecipe:', error);
      // Re-lanzar el error para que sea capturado por handleSave
      throw error;
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      console.log('🗑️ Eliminando receta con ID:', id);
      console.log('🗑️ Tipo de ID:', typeof id);
      
      if (!user?.id) {
        console.error('❌ No hay usuario autenticado para eliminar receta');
        return false;
      }

      // Verificar que la receta pertenece al usuario
      const recipeToDelete = recipes.find(r => r.id === id || r.id === id.toString());
      console.log('🔍 Receta encontrada:', recipeToDelete ? 'SÍ' : 'NO');
      console.log('🔍 Lista de IDs en el estado:', recipes.map(r => ({ id: r.id, title: r.title, createdByUser: r.createdByUser })));
      
      if (!recipeToDelete) {
        console.error('❌ No se encontró la receta con ID:', id);
        return false;
      }
      
      if (!recipeToDelete.createdByUser) {
        console.error('❌ Solo se pueden eliminar recetas creadas por el usuario');
        return false;
      }

      const body = {
        id: parseInt(id, 10),
        idUsuario: parseInt(user.id, 10),
      };

      const url = `${API_BASE_URL}/recipes/${id}&method=DELETE`;
      console.log('🗑️ Enviando DELETE a:', url);
      console.log('🗑️ Body:', body);

      const response = await fetch(url, {
        method: 'POST', // POST con query parameters como en otros endpoints
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error('❌ Error en respuesta de eliminación:', response.status);
        return false;
      }

      const json = await response.json();
      console.log('📝 Respuesta eliminación:', json);

      if (json.status >= 200 && json.status < 300) {
        console.log('✅ Receta eliminada exitosamente del backend');
        // Eliminar del estado local usando comparación flexible de IDs
        setRecipes((prev) => {
          const filtered = prev.filter((r) => r.id !== id && r.id !== id.toString());
          console.log('🗑️ Recetas después de eliminar:', filtered.length, 'de', prev.length);
          return filtered;
        });
        setFavorites((prev) => prev.filter((r) => r.id !== id && r.id !== id.toString()));
        return true;
      } else {
        console.error('❌ Error al eliminar receta:', json.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error al eliminar receta:', error);
      return false;
    }
  };

  
  const getFavoritesFromBackend = async (userId: string): Promise<Recipe[]> => {
    try {
      const baseUrl = API_BASE_URL.replace('?path=/api', '');
      const url = `${baseUrl}?path=/api/users/${userId}/favorites`;
      
      const response = await fetch(url);
      const json = await response.json();

      if (response.ok && json.status === 200 && json.data?.recetas && Array.isArray(json.data.recetas)) {
        const mapped = json.data.recetas.map((r: any): Recipe => ({
          id: r.idReceta.toString(),
          title: r.nombre,
          author: r.usuario || 'Autor desconocido',
          rating: 5,
          category: 'Sin categoría',
          image: r.imagenMiniatura ? { uri: r.imagenMiniatura } : require('../assets/placeholder.jpg'),
          ingredients: [],
          steps: [],
          createdByUser: false,
          createdAt: r.fechaPublicacion ? new Date(r.fechaPublicacion).getTime() : Date.now(),
          categoryId: r.tipo,
          servings: 1,
          userId: 0,
          description: r.descripcion || '', // Agregamos la descripción
        }));
        
        console.log('✅ Favoritos cargados:', mapped.length);
        return mapped;
      } else {
        console.error('❌ Error al obtener favoritos:', json.message || 'Error del servidor');
        return [];
      }
    } catch (error) {
      console.error('❌ Error de conexión al obtener favoritos:', error);
      return [];
    }
  };



  
  const toggleFavorite = async (recipe: Recipe) => {
    if (!user?.id) {
      console.error('⚠️ No hay usuario autenticado');
      return;
    }

    const exists = favorites.some((r) => r.id === recipe.id);
    console.log(`${exists ? '🗑️' : '❤️'} ${exists ? 'Eliminando' : 'Agregando'} favorito: ${recipe.title}`);

    try {
      if (exists) {
        const success = await removeFavoriteFromBackend(user.id, recipe.id);
        if (success) {
          setFavorites((prev) => prev.filter((r) => r.id !== recipe.id));
          console.log('✅ Favorito eliminado');
        }
      } else {
        const success = await addFavoriteToBackend(user.id, recipe.id);
        if (success) {
          setFavorites((prev) => [...prev, recipe]);
          console.log('✅ Favorito agregado');
        }
      }
    } catch (error) {
      console.error('❌ Error al actualizar favorito:', error);
    }
  };

  
  const addFavoriteToBackend = async (userId: string, recipeId: string): Promise<boolean> => {
    const baseUrl = API_BASE_URL.replace('?path=/api', '');
    const url = `${baseUrl}?path=/api/users/${userId}/favorites/${recipeId}`;
    
    try {
      const response = await fetch(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const json = await response.json();
      
      if (response.ok && (json.status === 200 || json.status === 201)) {
        return true;
      } else {
        console.error('❌ Error al agregar favorito:', json.message || 'Error del servidor');
        return false;
      }
    } catch (error) {
      console.error('❌ Error de conexión al agregar favorito:', error);
      return false;
    }
  };


  const removeFavoriteFromBackend = async (userId: string, recipeId: string): Promise<boolean> => {
    const baseUrl = API_BASE_URL.replace('?path=/api', '');
    const url = `${baseUrl}?path=/api/users/${userId}/favorites/${recipeId}&method=DELETE`;
    
    try {
      const response = await fetch(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const json = await response.json();
      
      if (response.ok && (json.status === 200 || json.status === 204)) {
        return true;
      } else {
        console.error('❌ Error al eliminar favorito:', json.message || 'Error del servidor');
        return false;
      }
    } catch (error) {
      console.error('❌ Error de conexión al eliminar favorito:', error);
      return false;
    }
  };


  /* const toggleFavorite = (recipe: Recipe) => {
    setFavorites((prev) => {
      const exists = prev.some((r) => r.id === recipe.id);
      return exists ? prev.filter((r) => r.id !== recipe.id) : [...prev, recipe];
    });
  }; */

  const isFavorite = (id: string) => {
    return favorites.some((r) => r.id === id);
  };

  const refreshFavorites = async () => {
    if (!user?.id) return;
    
    console.log('🔄 Refrescando favoritos...');
    const favs = await getFavoritesFromBackend(user.id);
    setFavorites(favs);
  };

  const getAvailableIngredients = async (): Promise<AvailableIngredient[]> => {
    try {
      const url = `${API_BASE_URL}/ingredients`;
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.status === 200 && Array.isArray(json.data)) {
        const mappedIngredients = json.data.map((ing: any) => ({
          id: ing.idIngrediente,
          name: ing.nombre,
        }));
        return mappedIngredients;
      }
      return [];
    } catch (error) {
      console.error('❌ Error al obtener ingredientes disponibles:', error);
      return [];
    }
  };

  const getRecipeIngredients = async (recipeId: string): Promise<any[]> => {
    try {
      const url = `${API_BASE_URL}/recipes/${recipeId}/getRecipeIngredients`;
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.status === 200 && json.data?.ingredientes) {
        const mappedIngredients = json.data.ingredientes.map((ing: any) => ({
          id: ing.id,
          name: ing.nombre,
          quantity: ing.cantidad,
          unit: ing.unidad,
        }));
        return mappedIngredients;
      }
      return [];
    } catch (error) {
      console.error('❌ Error al obtener ingredientes:', error);
      return [];
    }
  };

  const getRecipeSteps = async (recipeId: string): Promise<any[]> => {
    try {
      const url = `${API_BASE_URL}/recipes/${recipeId}/steps`;
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.status === 200 && json.data?.pasos) {
        const mappedSteps = json.data.pasos.map((paso: any) => ({
          text: paso.descripcion,
          description: paso.descripcion,
          order: paso.numero,
          image: paso.multimedia ? { uri: paso.multimedia } : null,
          imageUrl: paso.multimedia || '',
        }));
        return mappedSteps;
      }
      return [];
    } catch (error) {
      console.error('❌ Error al obtener pasos:', error);
      return [];
    }
  };

  const getRecipeDetails = async (recipeId: string): Promise<Recipe | null> => {
    try {
      console.log('🔍 Getting recipe details for ID:', recipeId);
      const [ingredients, steps] = await Promise.all([
        getRecipeIngredients(recipeId),
        getRecipeSteps(recipeId)
      ]);

      // Buscar la receta en el estado local primero
      let baseRecipe = recipes.find(r => r.id === recipeId || r.id.toString() === recipeId);
      
      // Si no se encuentra, intentar cargarla desde getUserRecipes
      if (!baseRecipe && user?.id) {
        console.log('📋 Receta no encontrada en estado local, cargando desde getUserRecipes...');
        try {
          const userRecipes = await getUserRecipes(user.id);
          baseRecipe = userRecipes.find(r => r.id === recipeId || r.id.toString() === recipeId);
          if (baseRecipe) {
            console.log('✅ Receta encontrada en getUserRecipes:', baseRecipe.title);
            // Agregar al estado local para futuras búsquedas
            setRecipes(prev => {
              const exists = prev.some(r => r.id === baseRecipe!.id);
              return exists ? prev : [...prev, baseRecipe!];
            });
          }
        } catch (error) {
          console.error('❌ Error al cargar desde getUserRecipes:', error);
        }
      }
      
      if (baseRecipe) {
        const completeRecipe = {
          ...baseRecipe,
          ingredients,
          steps
        };
        return completeRecipe;
      }
      console.log('❌ Base recipe not found for ID:', recipeId);
      return null;
    } catch (error) {
      console.error('❌ Error al obtener detalles de receta:', error);
      return null;
    }
  };

  const getUserRecipes = async (userId: string): Promise<Recipe[]> => {
    try {
      const url = `${API_BASE_URL}/users/${userId}/recipes`;
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.status === 200 && Array.isArray(json.data)) {
        console.log('🔍 getUserRecipes - Ejemplo de datos del backend:', json.data[0] ? {
          idReceta: json.data[0].idReceta,
          nombre: json.data[0].nombre,
          tipoId: json.data[0].tipoId,
          tipo: json.data[0].tipo
        } : 'No hay datos');
        
        const mappedRecipes = json.data.map((r: any): Recipe => ({
          id: r.idReceta.toString(),
          title: r.nombre,
          author: user?.username || user?.email || 'Usuario',
          rating: r.puntuacion || 5,
          category: r.tipo || 'Sin categoría',
          image: r.imagen ? { uri: r.imagen } : require('../assets/placeholder.jpg'),
          ingredients: r.ingredientes?.map((i: any) => ({
            id: i.idIngrediente,
            name: i.nombre,
            quantity: i.cantidad,
            unit: i.unidad,
          })) || [],
          steps: r.pasos?.map((p: any) => ({
            text: p.descripcion,
            description: p.descripcion,
            order: p.numero,
            image: p.multimedia ? { uri: p.multimedia } : null,
            imageUrl: p.multimedia || '',
          })) || [],
          createdByUser: true,
          createdAt: r.fechaCreacion ? new Date(r.fechaCreacion).getTime() : Date.now(),
          categoryId: r.tipoId,
          servings: r.porciones,
          userId: parseInt(userId, 10),
          description: r.descripcion,
        }));
        
        console.log('🔍 getUserRecipes encontró:', mappedRecipes.length, 'recetas del usuario');
        
        return mappedRecipes;
      }
      return [];
    } catch (error) {
      console.error('❌ Error al obtener recetas del usuario:', error);
      return [];
    }
  };

  // Función para forzar la actualización de createdByUser
  const refreshUserRecipesStatus = async (): Promise<Recipe[]> => {
    if (!user?.id) return recipes;
    
    console.log('🔄 FORCE REFRESH - Actualizando estado de recetas del usuario');
    try {
      const userRecipes = await getUserRecipes(user.id);
      console.log('🔄 FORCE REFRESH - Recetas del usuario encontradas:', userRecipes.length);
      
      return new Promise((resolve) => {
        setRecipes(prev => {
          const userRecipeIds = new Set(userRecipes.map(r => r.id.toString()));
          
          const updated = prev.map(recipe => {
            const isCreatedByUser = userRecipeIds.has(recipe.id.toString());
            return {
              ...recipe,
              createdByUser: isCreatedByUser,
              userId: isCreatedByUser ? parseInt(user.id, 10) : recipe.userId
            };
          });
          
          // Agregar recetas del usuario que falten
          const existingIds = new Set(prev.map(r => r.id.toString()));
          const toAdd = userRecipes.filter(ur => !existingIds.has(ur.id.toString()));
          
          const final = [...updated, ...toAdd];
          console.log('🔄 FORCE REFRESH - Recetas marcadas como del usuario:', final.filter(r => r.createdByUser).length);
          
          resolve(final);
          return final;
        });
      });
    } catch (error) {
      console.error('❌ Error en refreshUserRecipesStatus:', error);
      return recipes;
    }
  };

  const getRecipeAverageRating = async (recipeId: string): Promise<number> => {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/puntuacion`);
      const json = await response.json();
      
      if (json.status === 200 && json.data) {
        return json.data.promedio || 0;
      }
      return 0;
    } catch (error) {
      console.error('❌ Error al obtener valoración promedio:', error);
      return 0;
    }
  };

  return (
    <RecipeContext.Provider
      value={{ recipes, myRecipes, favorites, addRecipe, editRecipe, deleteRecipe, toggleFavorite, isFavorite, refreshFavorites, getRecipeIngredients, getRecipeSteps, getRecipeDetails, getAvailableIngredients, getUserRecipes, refreshUserRecipesStatus, getRecipeAverageRating, clearFavorites }}
    >
      {children}
    </RecipeContext.Provider>
  );
};
