import { useState, useCallback, useMemo } from 'react';
import { API_BASE_URL } from '../constants';

interface RatingData {
  promedio: number;
  votos: number;
}

interface RatingCache {
  [recipeId: string]: RatingData;
}

export const useRatingCache = () => {
  const [cache, setCache] = useState<RatingCache>({});
  const [loading, setLoading] = useState<Set<string>>(new Set());

  const getRating = useCallback((recipeId: string): RatingData | undefined => {
    return cache[recipeId];
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
      console.log(`🔍 Cargando valoración desde API para receta ${recipeId}`);
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/puntuacion`);
      const json = await response.json();

      let ratingData: RatingData;

      if (json.status === 200 && json.data && json.data.promedio !== null) {
        ratingData = {
          promedio: json.data.promedio,
          votos: json.data.cantidadVotos || 0
        };
        console.log(`✅ Valoración cargada para ${recipeId}: ${json.data.promedio} (${json.data.cantidadVotos} votos)`);
      } else {
        console.log(`⚠️ Sin valoración para receta ${recipeId}`);
        ratingData = { promedio: 0, votos: 0 };
      }

      // Guardar en cache
      setCache(prev => ({ ...prev, [recipeId]: ratingData }));
      
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

  const loadMultipleRatings = useCallback(async (recipeIds: string[]): Promise<RatingCache> => {
    // Filtrar solo los IDs que no están en cache y no se están cargando
    const idsToLoad = recipeIds.filter(id => !cache[id] && !loading.has(id));
    
    if (idsToLoad.length === 0) {
      console.log('📊 Todas las valoraciones solicitadas ya están en cache');
      return cache;
    }

    console.log(`🔍 Cargando ${idsToLoad.length} valoraciones nuevas de ${recipeIds.length} solicitadas`);

    // Cargar todas en paralelo
    const ratingPromises = idsToLoad.map(id => loadRating(id));
    await Promise.all(ratingPromises);

    console.log(`📊 Cache actualizado con ${idsToLoad.length} nuevas valoraciones`);
    return cache;
  }, [cache, loading, loadRating]);

  const updateRating = useCallback((recipeId: string, newRating: RatingData) => {
    console.log(`🔄 Actualizando valoración en cache para ${recipeId}: ${newRating.promedio}`);
    setCache(prev => ({ ...prev, [recipeId]: newRating }));
  }, []);

  const clearCache = useCallback(() => {
    console.log('🗑️ Limpiando cache de valoraciones');
    setCache({});
    setLoading(new Set());
  }, []);

  return useMemo(() => ({
    getRating,
    isLoading,
    loadRating,
    loadMultipleRatings,
    updateRating,
    clearCache,
    cacheSize: Object.keys(cache).length
  }), [getRating, isLoading, loadRating, loadMultipleRatings, updateRating, clearCache, cache]);
};
