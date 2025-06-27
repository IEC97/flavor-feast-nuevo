
// ✅ context/RecipeContext.tsx - CORREGIDO
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Recipe } from '../types';
import { API_BASE_URL } from '../constants'; 


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
            image: { uri: r.imagen },
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

  const addRecipe = (recipe: Recipe) => {
    setRecipes((prev) => [...prev, { ...recipe, createdByUser: true }]);
  };
  

  /* const editRecipe = (id: string, updated: Partial<Recipe>) => {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
  }; */

  const editRecipe = async (id: string, updated: Partial<Recipe>) => {
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
  };

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

  return (
    <RecipeContext.Provider
      value={{ recipes, myRecipes, favorites, addRecipe, editRecipe, deleteRecipe, toggleFavorite, isFavorite }}
    >
      {children}
    </RecipeContext.Provider>
  );
};
