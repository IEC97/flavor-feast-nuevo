import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { API_BASE_URL } from '../constants';

interface RatingData {
  promedio: number;
  votos: number;
}

interface RatingCache {
  [recipeId: string]: RatingData;
}

interface RatingCacheContextType {
  getRating: (recipeId: string) => RatingData | undefined;
  isLoading: (recipeId: string) => boolean;
  loadRating: (recipeId: string) => Promise<RatingData>;
  loadMultipleRatings: (recipeIds: string[]) => Promise<void>;
  updateRating: (recipeId: string, newRating: RatingData) => void;
  clearCache: () => void;
  cacheSize: number;
  updateCounter: number; // Contador para tracking de actualizaciones
}

const RatingCacheContext = createContext<RatingCacheContextType | undefined>(undefined);

export const RatingCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<RatingCache>({});
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [updateCounter, setUpdateCounter] = useState(0); // Contador para forzar re-renders

  const getRating = useCallback((recipeId: string): RatingData | undefined => {
    const rating = cache[recipeId];
    // Solo loggear para debug específico
    if (recipeId === '1' && rating) {
      // Cache hit para rating
    }
    return rating;
  }, [cache]);

  const isLoading = useCallback((recipeId: string): boolean => {
    return loading.has(recipeId);
  }, [loading]);

  const loadRating = useCallback(async (recipeId: string): Promise<RatingData> => {
    // Si ya está en cache, devolver directamente
    if (cache[recipeId]) {
      return cache[recipeId];
    }

    // Si ya se está cargando, esperar un poco y revisar de nuevo
    if (loading.has(recipeId)) {
      return new Promise((resolve) => {
        const checkCache = () => {
          if (cache[recipeId]) {
            resolve(cache[recipeId]);
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }

    // Marcar como cargando
    setLoading(prev => new Set(prev.add(recipeId)));

    try {
      // Cargando valoración desde API
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/puntuacion`);
      const json = await response.json();

      let ratingData: RatingData;

      if (json.status === 200 && json.data && json.data.promedio !== null) {
        ratingData = {
          promedio: json.data.promedio,
          votos: json.data.cantidadVotos || 0
        };
        // Valoración cargada exitosamente
      } else {
        // Sin valoración para esta receta
        ratingData = { promedio: 0, votos: 0 };
      }

      // Guardar en cache
      setCache(prev => ({ ...prev, [recipeId]: ratingData }));
      setUpdateCounter(prev => prev + 1); // Incrementar contador de actualizaciones
      
      return ratingData;
    } catch (error) {
      console.error(`❌ Error al cargar valoración para receta ${recipeId}:`, error);
      const errorData = { promedio: 0, votos: 0 };
      setCache(prev => ({ ...prev, [recipeId]: errorData }));
      return errorData;
    } finally {
      // Quitar del estado de carga
      setLoading(prev => {
        const newLoading = new Set(prev);
        newLoading.delete(recipeId);
        return newLoading;
      });
    }
  }, [cache, loading]);

  const loadMultipleRatings = useCallback(async (recipeIds: string[]): Promise<void> => {
    // Filtrar solo los IDs que no están en cache y no se están cargando
    const idsToLoad = recipeIds.filter(id => !cache[id] && !loading.has(id));
    
    if (idsToLoad.length === 0) {
      // Todas las valoraciones ya están en cache
      return;
    }

    // Cargando valoraciones nuevas

    // Cargar todas en paralelo
    const ratingPromises = idsToLoad.map(id => loadRating(id));
    await Promise.all(ratingPromises);

    // Cache actualizado con nuevas valoraciones
  }, [cache, loading, loadRating]);

  const updateRating = useCallback((recipeId: string, newRating: RatingData) => {
    // Actualizando valoración en cache
    setCache(prev => ({ ...prev, [recipeId]: newRating }));
    setUpdateCounter(prev => prev + 1); // Incrementar contador de actualizaciones
  }, []);

  const clearCache = useCallback(() => {
    // Limpiando cache de valoraciones
    setCache({});
    setLoading(new Set());
    setUpdateCounter(prev => prev + 1); // Incrementar contador de actualizaciones
  }, []);

  const value = useMemo(() => ({
    getRating,
    isLoading,
    loadRating,
    loadMultipleRatings,
    updateRating,
    clearCache,
    cacheSize: Object.keys(cache).length,
    updateCounter // Exponer el contador para que los componentes puedan escuchar cambios
  }), [getRating, isLoading, loadRating, loadMultipleRatings, updateRating, clearCache, cache, updateCounter]);

  return (
    <RatingCacheContext.Provider value={value}>
      {children}
    </RatingCacheContext.Provider>
  );
};

export const useRatingCache = (): RatingCacheContextType => {
  const context = useContext(RatingCacheContext);
  if (context === undefined) {
    throw new Error('useRatingCache debe ser usado dentro de un RatingCacheProvider');
  }
  return context;
};
