// ✅ context/RecipeContext.tsx - CORREGIDO
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Recipe } from '../types';
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
  deleteRecipe: (id: string) => void;
  toggleFavorite: (recipe: Recipe) => void;
  isFavorite: (id: string) => boolean;
  getRecipeIngredients: (recipeId: string) => Promise<any[]>;
  getRecipeSteps: (recipeId: string) => Promise<any[]>;
  getRecipeDetails: (recipeId: string) => Promise<Recipe | null>;
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
          const mapped = json.data.map((r: any): Recipe => ({
            id: r.idReceta,
            title: r.nombre,
            author: r.usuario || 'Desconocido',
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
            createdByUser: false,
            createdAt: r.fechaCreacion ? new Date(r.fechaCreacion).getTime() : Date.now(),
          }));

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

  /* const addRecipe = (recipe: Recipe) => {
    setRecipes((prev) => [...prev, { ...recipe, createdByUser: true }]);
  }; */

  const addRecipe = async (recipe: Recipe) => {
    console.log('🍳 Datos de la receta recibida:', {
      title: recipe.title,
      categoryId: recipe.categoryId,
      servings: recipe.servings,
      description: recipe.description
    });
    
    //console.log('Valor de user en addRecipe:', user);
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
      idUsuario: user.id,
      nombre: recipe.title,
      descripcion: recipe.description || '', // Valor por defecto si no hay descripción
      // Si hay imagen seleccionada, usa su URL; si no, usa una URL de placeholder
      imagen: (recipe.image && typeof recipe.image === 'object' && 'uri' in recipe.image) 
        ? recipe.image.uri 
        : 'https://via.placeholder.com/300x200.png?text=Receta',
      tipoId: recipe.categoryId,
      porciones: recipe.servings || 1, // Valor por defecto si no hay porciones
      ingredientes: recipe.ingredients.map(i => ({
        nombre: i.name,
        cantidad: i.quantity,
        unidad: i.unit || '', // Valor por defecto si no hay unidad
      })),
      pasos: recipe.steps.map(s => ({
        descripcion: s.description || s.text || '',
        multimedia: (s.image && typeof s.image === 'object' && 'uri' in s.image) ? s.image.uri : '',
      })),
    };
    // 1. Llama al backend para crear la receta
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
  

  /* const editRecipe = (id: string, updated: Partial<Recipe>) => {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
  }; */

 /*  const editRecipe = async (id: string, updated: Partial<Recipe>) => {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));

  // Solo sincroniza si la receta fue creada por el usuario
  const recipeToEdit = recipes.find((r) => r.id === id);
    if (recipeToEdit?.createdByUser && user?.id) {
      // Transforma el objeto al formato esperado por el backend
      const backendRecipe = {
        idUsuario: user.id,
        nombre: updated.title ?? recipeToEdit.title,
        descripcion: updated.description ?? recipeToEdit.description,
        imagen: updated.image?.uri ?? recipeToEdit.image?.uri,
        tipoId: updated.categoryId ?? recipeToEdit.categoryId,
        porciones: updated.servings ?? recipeToEdit.servings,
        ingredientes: (updated.ingredients ?? recipeToEdit.ingredients).map(i => ({
          nombre: i.name,
          cantidad: i.quantity,
          unidad: i.unit,
        })),
        pasos: (updated.steps ?? recipeToEdit.steps).map(s => ({
          descripcion: s.description,
          multimedia: s.image?.uri || '',
        })),
      };

      try {
        await fetch(
          `${API_BASE_URL}/recipes/${id}&method=PUT`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendRecipe),
          }
        );
      } catch (error) {
        console.error('Error actualizando receta en backend:', error);
      }
    }
  }; */

  const editRecipe = async (id: string, updated: Partial<Recipe>) => {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));

    const recipeToEdit = recipes.find((r) => r.id === id);
    if (recipeToEdit?.createdByUser && user?.id) {
      const camposModificados: any = {};

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
      if (
        updated.ingredients &&
        JSON.stringify(updated.ingredients) !== JSON.stringify(recipeToEdit.ingredients)
      ) {
        camposModificados.ingredientes = updated.ingredients.map((i) => ({
          idIngrediente: i.id || 1, // Ajustá esto si manejás IDs reales
          cantidad: i.quantity,
          unidad: i.unit,
        }));
      }
      if (
        updated.steps &&
        JSON.stringify(updated.steps) !== JSON.stringify(recipeToEdit.steps)
      ) {
        camposModificados.pasos = updated.steps.map((s) => ({
          descripcion: s.description || s.text || '',
          multimedia: (s.image && typeof s.image === 'object' && 'uri' in s.image) ? s.image.uri : '',
        }));
      }

      // Si no hay cambios, no mandamos nada
      if (Object.keys(camposModificados).length === 0) {
        console.log('No hay cambios para actualizar');
        return;
      }

      const body = {
        idUsuario: user.id,
        id,
        camposModificados,
      };

      try {
        const res = await fetch(`${API_BASE_URL}/recipes/${id}&method=PUT`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        console.log('📝 Respuesta actualización:', json);
      } catch (error) {
        console.error('Error actualizando receta en backend:', error);
      }
    }
  };




  /* const editRecipe = async (id: string, updated: Partial<Recipe>) => {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));

    // Solo sincroniza si la receta fue creada por el usuario
    const recipeToEdit = recipes.find((r) => r.id === id);
    if (recipeToEdit?.createdByUser) {
      try {
        await fetch(
          `${API_BASE_URL}/recipes/${id}&method=PUT`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }
        );
      } catch (error) {
        console.error('Error actualizando receta en backend:', error);
      }
    }
  }; */

  const deleteRecipe = (id: string) => {
    console.log('🗑️ Eliminando receta con ID:', id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setFavorites((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleFavorite = (recipe: Recipe) => {
    setFavorites((prev) => {
      const exists = prev.some((r) => r.id === recipe.id);
      return exists ? prev.filter((r) => r.id !== recipe.id) : [...prev, recipe];
    });
  };

  const isFavorite = (id: string) => {
    return favorites.some((r) => r.id === id);
  };

  const getRecipeIngredients = async (recipeId: string): Promise<any[]> => {
    try {
      const url = `${API_BASE_URL}/recipes/${recipeId}/getRecipeIngredients`;
      console.log('🔍 Fetching ingredients from:', url);
      const response = await fetch(url);
      const json = await response.json();
      console.log('📥 Ingredients response:', json);
      
      if (json.status === 200 && json.data?.ingredientes) {
        const mappedIngredients = json.data.ingredientes.map((ing: any) => ({
          id: ing.id,
          name: ing.nombre,
          quantity: ing.cantidad,
          unit: ing.unidad,
        }));
        console.log('✅ Mapped ingredients:', mappedIngredients);
        return mappedIngredients;
      }
      console.log('⚠️ No ingredients found in response');
      return [];
    } catch (error) {
      console.error('❌ Error al obtener ingredientes:', error);
      return [];
    }
  };

  const getRecipeSteps = async (recipeId: string): Promise<any[]> => {
    try {
      const url = `${API_BASE_URL}/recipes/${recipeId}/steps`;
      console.log('🔍 Fetching steps from:', url);
      const response = await fetch(url);
      const json = await response.json();
      console.log('📥 Steps response:', json);
      
      if (json.status === 200 && json.data?.pasos) {
        const mappedSteps = json.data.pasos.map((paso: any) => ({
          text: paso.descripcion,
          description: paso.descripcion,
          order: paso.numero,
          image: paso.multimedia ? { uri: paso.multimedia } : null,
        }));
        console.log('✅ Mapped steps:', mappedSteps);
        return mappedSteps;
      }
      console.log('⚠️ No steps found in response');
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

      const baseRecipe = recipes.find(r => r.id === recipeId);
      console.log('📋 Base recipe found:', baseRecipe?.title || 'Not found');
      console.log('🥕 Ingredients loaded:', ingredients?.length || 0);
      console.log('📝 Steps loaded:', steps?.length || 0);
      
      if (baseRecipe) {
        const completeRecipe = {
          ...baseRecipe,
          ingredients,
          steps
        };
        console.log('✅ Complete recipe prepared:', {
          title: completeRecipe.title,
          ingredientsCount: completeRecipe.ingredients?.length || 0,
          stepsCount: completeRecipe.steps?.length || 0
        });
        return completeRecipe;
      }
      console.log('❌ Base recipe not found for ID:', recipeId);
      return null;
    } catch (error) {
      console.error('❌ Error al obtener detalles de receta:', error);
      return null;
    }
  };

  return (
    <RecipeContext.Provider
      value={{ recipes, myRecipes, favorites, addRecipe, editRecipe, deleteRecipe, toggleFavorite, isFavorite, getRecipeIngredients, getRecipeSteps, getRecipeDetails }}
    >
      {children}
    </RecipeContext.Provider>
  );
};
