// components/RatingCacheInitializer.tsx
import { useEffect } from 'react';
import { useRatingCache } from '../context/RatingCacheContext';

export const RatingCacheInitializer = () => {
  const ratingCache = useRatingCache();

  useEffect(() => {
    // Cargar todas las valoraciones al inicio de la aplicación
    if (!ratingCache.isInitialLoadComplete) {
      console.log('🚀 Iniciando carga inicial de valoraciones...');
      ratingCache.loadAllRatings();
    }
  }, [ratingCache.isInitialLoadComplete]);

  return null; // Este componente no renderiza nada
};
