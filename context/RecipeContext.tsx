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
  addRecipe: (recipe: Recipe) => void;
  editRecipe: (id: string, updatedRecipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => Promise<boolean>;
  toggleFavorite: (recipe: Recipe) => void;
  isFavorite: (id: string) => boolean;
  getRecipeIngredients: (recipeId: string) => Promise<any[]>;
  getRecipeSteps: (recipeId: string) => Promise<any[]>;
  getRecipeDetails: (recipeId: string) => Promise<Recipe | null>;
  getAvailableIngredients: () => Promise<AvailableIngredient[]>;
  getUserRecipes: (userId: string) => Promise<Recipe[]>;
  refreshUserRecipesStatus: () => Promise<Recipe[]>;
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
          console.log('🔍 Ejemplo de datos del backend:', json.data[0] ? {
            idReceta: json.data[0].idReceta,
            nombre: json.data[0].nombre,
            tipoId: json.data[0].tipoId,
            tipo: json.data[0].tipo
          } : 'No hay datos');
          
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
            })) || [],
            createdByUser: false, // Se actualizará más tarde cuando tengamos el usuario
            createdAt: r.fechaCreacion ? new Date(r.fechaCreacion).getTime() : Date.now(),
            categoryId: r.tipoId,
            servings: r.porciones,
            userId: r.idUsuario, // Guardamos el ID del usuario para comparar después
          }));

          console.log('📥 Recetas cargadas desde backend:', mapped.length);
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


  // Actualizar createdByUser cuando el usuario esté disponible
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Actualizando createdByUser para usuario ID:', user.id);
      
      // Cargar recetas del usuario y marcarlas correctamente
      const loadUserRecipesAndMark = async () => {
        try {
          // Obtener las recetas específicas del usuario
          const userRecipes = await getUserRecipes(user.id);
          console.log('📋 Recetas del usuario encontradas:', userRecipes.length);
          
          // Actualizar el estado de recetas
          setRecipes(prev => {
            // Crear un mapa de las recetas del usuario para búsqueda rápida
            const userRecipeIds = new Set(userRecipes.map(r => r.id.toString()));
            console.log('🎯 Recetas del usuario marcadas:', userRecipeIds.size);
            
            // Actualizar recetas existentes y agregar las que falten
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
            
            // Agregar recetas del usuario que no estén en la lista general
            const finalRecipes = [...updated, ...recipesToAdd];
            
            const userRecipesMarked = finalRecipes.filter(r => r.createdByUser);
            console.log('✅ Recetas marcadas como del usuario:', userRecipesMarked.length);
            
            return finalRecipes;
          });
        } catch (error) {
          console.error('❌ Error al cargar y marcar recetas del usuario:', error);
        }
      };
      
      loadUserRecipesAndMark();
    }
  }, [user?.id, recipes.length]); // Add recipes.length as dependency

  const addRecipe = async (recipe: Recipe) => {
    console.log('🍳 Datos de la receta recibida:', {
      title: recipe.title,
      categoryId: recipe.categoryId,
      servings: recipe.servings,
      description: recipe.description
    });
    
    if (!user?.id) {
      console.error('No hay usuario autenticado');
      return;
    }

    // Validar que categoryId sea válido
    if (!recipe.categoryId || isNaN(recipe.categoryId)) {
      console.error('Error: categoryId es requerido y debe ser un número válido');
      return;
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
        multimedia: (s.image && typeof s.image === 'object' && 'uri' in s.image) ? s.image.uri : '',
      })),
    };
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/recipes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backendRecipe),
        }
      );
      const json = await response.json();
      console.log('Respuesta del backend:', json);

      const statusCode = Number(json.status);

      // 2. Si la creación fue exitosa, agrega la receta al estado local
      if (statusCode >= 200 && statusCode < 300 && json.data) {
        // Muestra el mensaje del backend al usuario (creado o actualizado)
        console.log('✅ Receta guardada:', json.message);
        setRecipes((prev) => [
          ...prev,
          { ...recipe, id: json.data.idReceta || Date.now().toString(), createdByUser: true },
        ]);
      } else {
        console.error('Error al crear receta:', json.message);
      }

    } catch (error) {
      console.error('Error al conectar con el backend:', error);
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
            multimedia: (s.image && typeof s.image === 'object' && 'uri' in s.image) ? s.image.uri : '',
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
            return;
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
              return;
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
          }
          
        } catch (error) {
          console.error('❌ Error actualizando receta en backend:', error);
        }
      } else {
        console.log('⚠️ No se puede editar: receta no creada por usuario o usuario no autenticado');
      }
    } catch (error) {
      console.error('❌ Error general en editRecipe:', error);
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      console.log('🗑️ Eliminando receta con ID:', id);
      
      if (!user?.id) {
        console.error('❌ No hay usuario autenticado para eliminar receta');
        return false;
      }

      // Verificar que la receta pertenece al usuario
      const recipeToDelete = recipes.find(r => r.id === id);
      if (!recipeToDelete?.createdByUser) {
        console.error('❌ Solo se pueden eliminar recetas creadas por el usuario');
        return false;
      }

      const body = {
        id: parseInt(id, 10),
        idUsuario: parseInt(user.id, 10),
      };

      const url = `${API_BASE_URL}/recipes/${id}&method=DELETE`;
      console.log('🗑️ Enviando DELETE a:', url);

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
        // Eliminar del estado local
        setRecipes((prev) => prev.filter((r) => r.id !== id));
        setFavorites((prev) => prev.filter((r) => r.id !== id));
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
      const url = `${API_BASE_URL}/users/${userId}/favorites`;
      const response = await fetch(url);
      const json = await response.json();

      if (json.status === 200 && Array.isArray(json.data)) {
        const mapped = json.data.map((r: any): Recipe => ({
          id: r.idReceta.toString(),
          title: r.nombre,
          author: r.usuario || 'Desconocido',
          rating: r.puntuacion || 5,
          category: r.tipo || 'Sin categoría',
          image: r.imagen ? { uri: r.imagen } : require('../assets/placeholder.jpg'),
          ingredients: [],
          steps: [],
          createdByUser: false,
          createdAt: r.fechaCreacion ? new Date(r.fechaCreacion).getTime() : Date.now(),
          categoryId: r.tipoId,
          servings: r.porciones,
          userId: r.idUsuario,
        }));
        return mapped;
      }
      return [];
    } catch (error) {
      console.error('❌ Error al obtener favoritos del backend:', error);
      return [];
    }
  };



  
  const toggleFavorite = (recipe: Recipe) => {
      if (!user?.id) {
        console.error('⚠️ No hay usuario autenticado');
        return;
      }

      setFavorites((prev) => {
        const exists = prev.some((r) => r.id === recipe.id);
        if (exists) {
          removeFavoriteFromBackend(user.id, recipe.id);
          return prev.filter((r) => r.id !== recipe.id);
        } else {
          addFavoriteToBackend(user.id, recipe.id);
        return [...prev, recipe];
        }
    });
  };

  
  const addFavoriteToBackend = async (userId: string, recipeId: string) => {
    const url = `${API_BASE_URL}/users/${userId}/favorites/${recipeId}`;
    try {
      await fetch(url, { method: 'POST' });
    } catch (error) {
      console.error('❌ Error al agregar favorito:', error);
    }
  };


  const removeFavoriteFromBackend = async (userId: string, recipeId: string) => {
    const url = `${API_BASE_URL}/users/${userId}/favorites/${recipeId}&method=DELETE`;
    try {
      await fetch(url, { method: 'POST' });
    } catch (error) {
      console.error('❌ Error al eliminar favorito:', error);
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

  return (
    <RecipeContext.Provider
      value={{ recipes, myRecipes, favorites, addRecipe, editRecipe, deleteRecipe, toggleFavorite, isFavorite, getRecipeIngredients, getRecipeSteps, getRecipeDetails, getAvailableIngredients, getUserRecipes, refreshUserRecipesStatus }}
    >
      {children}
    </RecipeContext.Provider>
  );
};
