// config/imageUploadConfig.ts
// Configuración para servicios de subida de imágenes

// ========================================
// OPCIÓN 1: ImgBB (Recomendado)
// ========================================
// 1. Ve a https://api.imgbb.com/
// 2. Regístrate gratis (500 MB de almacenamiento)
// 3. Ve a "API" y copia tu API key
// 4. Reemplaza 'tu_api_key_aqui' con tu API key real
export const IMGBB_CONFIG = {
  API_KEY: 'tu_api_key_aqui', // Reemplazar con tu API key de ImgBB
  UPLOAD_URL: 'https://api.imgbb.com/1/upload',
  EXPIRATION_SECONDS: 15552000, // 6 meses
};

// ========================================
// OPCIÓN 2: Cloudinary (Alternativa)
// ========================================
// 1. Ve a https://cloudinary.com/
// 2. Regístrate gratis (25 GB de almacenamiento)
// 3. En tu dashboard, copia el "Cloud Name"
// 4. Ve a Settings > Upload y crea un "Upload Preset" (unsigned)
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: 'dkhbff9ze', // Reemplazar con tu cloud name
  UPLOAD_PRESET: 'flavorfeastapi', // Reemplazar con tu upload preset
  UPLOAD_URL: (cloudName: string) => `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
};

// ========================================
// CONFIGURACIÓN ACTUAL
// ========================================
// Cambia esto para usar el servicio que prefieras
export const IMAGE_UPLOAD_SERVICE: 'imgbb' | 'cloudinary' = 'cloudinary';

// ========================================
// INSTRUCCIONES DE CONFIGURACIÓN
// ========================================
/*

PARA IMGBB:
1. Ve a https://api.imgbb.com/
2. Haz clic en "Sign up" y crea una cuenta gratuita
3. Verifica tu email
4. Ve a la sección "API" en tu dashboard
5. Copia tu API key
6. Reemplaza 'tu_api_key_aqui' en IMGBB_CONFIG.API_KEY

PARA CLOUDINARY:
1. Ve a https://cloudinary.com/
2. Haz clic en "Sign up for free"
3. Completa el registro
4. En tu dashboard verás tu "Cloud name"
5. Ve a Settings (ícono de engranaje) > Upload
6. Haz clic en "Add upload preset"
7. Pon un nombre (ej: "recipe_images")
8. Cambia "Signing Mode" a "Unsigned"
9. Haz clic en "Save"
10. Copia el nombre del preset
11. Reemplaza los valores en CLOUDINARY_CONFIG

RECOMENDACIÓN:
- ImgBB es más simple de configurar
- Cloudinary tiene más funciones (redimensionamiento automático, etc.)
- Ambos son gratuitos para uso básico

*/
