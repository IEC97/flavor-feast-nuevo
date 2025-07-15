import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  loadAllRatings: () => Promise<void>; // Nueva función para cargar todas las valoraciones
  loadAndUpdateRating: (recipeId: string) => Promise<RatingData>; // Nueva función para cargar y actualizar valoración específica
  updateRating: (recipeId: string, newRating: RatingData) => void;
  clearCache: () => void;
  cacheSize: number;
  updateCounter: number; // Contador para tracking de actualizaciones
  isLoadingAll: boolean; // Indicador de carga masiva
  isInitialLoadComplete: boolean; // Indicador de si se completó la carga inicial
}

const RatingCacheContext = createContext<RatingCacheContextType | undefined>(undefined);

export const RatingCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<RatingCache>({});
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [updateCounter, setUpdateCounter] = useState(0); // Contador para forzar re-renders
  const [isLoadingAll, setIsLoadingAll] = useState(false); // Estado para carga masiva
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false); // Flag para carga inicial
  const pendingNoRatingRecipes = useRef<Set<string>>(new Set());

  // Efecto para procesar las recetas pendientes de marcar como sin valoración
  useEffect(() => {
    if (isInitialLoadComplete && pendingNoRatingRecipes.current.size > 0) {
      const updates: RatingCache = {};
      pendingNoRatingRecipes.current.forEach(recipeId => {
        if (!cache[recipeId]) { // Solo si no está ya en cache
          updates[recipeId] = { promedio: 0, votos: 0 };
        }
      });
      
      if (Object.keys(updates).length > 0) {
        setCache(prev => ({ ...prev, ...updates }));
        setUpdateCounter(prev => prev + 1);
      }
      
      pendingNoRatingRecipes.current.clear();
    }
  }, [isInitialLoadComplete, cache]);

  const getRating = useCallback((recipeId: string): RatingData | undefined => {
    const rating = cache[recipeId];
    
    // Si ya existe en cache, devolverlo
    if (rating) {
      return rating;
    }
    
    // Si la carga inicial está completa, marcar como sin valoración
    if (isInitialLoadComplete) {
      console.log(`📝 Marcando receta ${recipeId} como sin valoración (carga inicial completa)`);
      const noRatingData = { promedio: 0, votos: 0 };
      
      // Agregar a pendientes para procesamiento posterior
      pendingNoRatingRecipes.current.add(recipeId);
      
      return noRatingData;
    }
    
    // Log para debug
    console.log(`⏳ Receta ${recipeId} sin valoración en cache, carga inicial aún no completa`);
    return undefined;
  }, [cache, isInitialLoadComplete]);

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

  const loadAllRatings = useCallback(async (): Promise<void> => {
    // Solo cargar si no se ha completado la carga inicial y no está cargando actualmente
    if (isInitialLoadComplete || isLoadingAll) {
      console.log('🔄 Carga inicial ya completada o en progreso, saltando...');
      return;
    }
    
    setIsLoadingAll(true);
    try {
      console.log('🔄 Cargando todas las valoraciones por primera vez...');
      
      // Usar el nuevo endpoint que devuelve todas las valoraciones
      const response = await fetch(`${API_BASE_URL}/recipes/0/puntuacion`);
      const json = await response.json();

      if (json.status === 200 && json.data && Array.isArray(json.data)) {
        const newCache: RatingCache = {};
        
        // Procesar cada valoración recibida
        json.data.forEach((item: any) => {
          const recipeId = item.idReceta.toString();
          newCache[recipeId] = {
            promedio: item.promedio || 0,
            votos: item.cantidadVotos || 0
          };
        });

        // Actualizar el cache con todas las valoraciones
        setCache(newCache); // Reemplazar completamente el cache
        setUpdateCounter(prev => prev + 1);
        setIsInitialLoadComplete(true); // Marcar como completado
        
        console.log(`✅ Carga inicial completada: ${Object.keys(newCache).length} valoraciones en cache`);
      } else {
        console.error('❌ Error al cargar valoraciones iniciales:', json.message);
        setIsInitialLoadComplete(true); // Marcar como completado incluso si falla
      }
    } catch (error) {
      console.error('❌ Error al cargar todas las valoraciones:', error);
      setIsInitialLoadComplete(true); // Marcar como completado incluso si falla
    } finally {
      setIsLoadingAll(false);
    }
  }, [isInitialLoadComplete, isLoadingAll]);

  const updateRating = useCallback((recipeId: string, newRating: RatingData) => {
    // Actualizando valoración en cache
    setCache(prev => ({ ...prev, [recipeId]: newRating }));
    setUpdateCounter(prev => prev + 1); // Incrementar contador de actualizaciones
  }, []);

  const clearCache = useCallback(() => {
    // Limpiando cache de valoraciones y reseteando flag inicial
    setCache({});
    setLoading(new Set());
    setIsInitialLoadComplete(false); // Resetear flag para permitir nueva carga inicial
    setUpdateCounter(prev => prev + 1); // Incrementar contador de actualizaciones
  }, []);

  // Nueva función para cargar una valoración específica y actualizar el cache
  const loadAndUpdateRating = useCallback(async (recipeId: string): Promise<RatingData> => {
    console.log(`🔄 Cargando valoración específica para receta ${recipeId}...`);
    
    // Marcar como cargando
    setLoading(prev => new Set(prev.add(recipeId)));

    try {
      // Cargar valoración específica desde API
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/puntuacion`);
      const json = await response.json();

      let ratingData: RatingData;

      if (json.status === 200 && json.data && json.data.promedio !== null) {
        ratingData = {
          promedio: json.data.promedio,
          votos: json.data.cantidadVotos || 0
        };
        console.log(`✅ Valoración específica cargada para receta ${recipeId}:`, ratingData);
      } else {
        // Sin valoración para esta receta
        ratingData = { promedio: 0, votos: 0 };
        console.log(`⚠️ Sin valoración para receta ${recipeId}`);
      }

      // Actualizar en cache
      setCache(prev => ({ ...prev, [recipeId]: ratingData }));
      setUpdateCounter(prev => prev + 1);
      
      return ratingData;
    } catch (error) {
      console.error(`❌ Error al cargar valoración específica para receta ${recipeId}:`, error);
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
  }, []);

  const value = useMemo(() => ({
    getRating,
    isLoading,
    loadRating,
    loadMultipleRatings,
    loadAllRatings,
    loadAndUpdateRating,
    updateRating,
    clearCache,
    cacheSize: Object.keys(cache).length,
    updateCounter, // Exponer el contador para que los componentes puedan escuchar cambios
    isLoadingAll, // Exponer el estado de carga masiva
    isInitialLoadComplete // Exponer el estado de carga inicial
  }), [getRating, isLoading, loadRating, loadMultipleRatings, loadAllRatings, loadAndUpdateRating, updateRating, clearCache, cache, updateCounter, isLoadingAll, isInitialLoadComplete]);

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
