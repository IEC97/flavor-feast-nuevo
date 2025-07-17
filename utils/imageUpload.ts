// utils/imageUpload.ts
import * as ImagePicker from 'expo-image-picker';
import { IMGBB_CONFIG, CLOUDINARY_CONFIG, IMAGE_UPLOAD_SERVICE } from '../config/imageUploadConfig';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const pickImageFromGallery = async (): Promise<ImagePicker.ImagePickerResult | null> => {
  try {
    // Solicitar permisos
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      throw new Error('Se necesita permiso para acceder a la galería.');
    }

    // Abrir selector de imágenes
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9], // Aspecto para imágenes de recetas
      quality: 0.8, // Comprimir para subida más rápida
    });

    return result;
  } catch (error) {
    console.error('Error al seleccionar imagen:', error);
    return null;
  }
};

export const uploadImageToImgBB = async (imageUri: string): Promise<ImageUploadResult> => {
  try {
    // Verificar que tenemos una API key
    if (!IMGBB_CONFIG.API_KEY || IMGBB_CONFIG.API_KEY === 'tu_api_key_aqui') {
      return {
        success: false,
        error: 'API key de ImgBB no configurada. Ve a config/imageUploadConfig.ts para configurar.'
      };
    }

    // Convertir imagen a base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          const base64Image = base64Data.split(',')[1]; // Remover el prefijo data:image/...;base64,

          // Crear FormData para la subida
          const formData = new FormData();
          formData.append('key', IMGBB_CONFIG.API_KEY);
          formData.append('image', base64Image);
          formData.append('expiration', IMGBB_CONFIG.EXPIRATION_SECONDS.toString());

          // Subir imagen
          const uploadResponse = await fetch(IMGBB_CONFIG.UPLOAD_URL, {
            method: 'POST',
            body: formData,
          });

          const uploadResult = await uploadResponse.json();

          if (uploadResult.success) {
            resolve({
              success: true,
              url: uploadResult.data.url
            });
          } else {
            resolve({
              success: false,
              error: uploadResult.error?.message || 'Error al subir imagen'
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: `Error en la subida: ${error}`
          });
        }
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return {
      success: false,
      error: `Error al procesar imagen: ${error}`
    };
  }
};

// Función alternativa usando Cloudinary (gratuito hasta 25 GB)
export const uploadImageToCloudinary = async (imageUri: string): Promise<ImageUploadResult> => {
  try {
    if (CLOUDINARY_CONFIG.CLOUD_NAME === 'tu_cloud_name' || CLOUDINARY_CONFIG.UPLOAD_PRESET === 'tu_upload_preset') {
      return {
        success: false,
        error: 'Cloudinary no configurado. Ve a config/imageUploadConfig.ts para configurar.'
      };
    }

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `recipe_${Date.now()}.jpg`,
    } as any);
    formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);

    const response = await fetch(
      CLOUDINARY_CONFIG.UPLOAD_URL(CLOUDINARY_CONFIG.CLOUD_NAME),
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const result = await response.json();

    if (result.secure_url) {
      return {
        success: true,
        url: result.secure_url
      };
    } else {
      return {
        success: false,
        error: result.error?.message || 'Error al subir imagen'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Error al subir imagen: ${error}`
    };
  }
};

// Función principal que puedes usar en tus componentes
export const pickAndUploadImage = async (uploadService: 'imgbb' | 'cloudinary' = IMAGE_UPLOAD_SERVICE): Promise<ImageUploadResult> => {
  try {
    // Seleccionar imagen
    const pickerResult = await pickImageFromGallery();
    
    if (!pickerResult || pickerResult.canceled || !pickerResult.assets?.[0]) {
      return {
        success: false,
        error: 'No se seleccionó ninguna imagen'
      };
    }

    const imageUri = pickerResult.assets[0].uri;

    // Subir imagen según el servicio elegido
    if (uploadService === 'cloudinary') {
      return await uploadImageToCloudinary(imageUri);
    } else {
      return await uploadImageToImgBB(imageUri);
    }
  } catch (error) {
    return {
      success: false,
      error: `Error en el proceso: ${error}`
    };
  }
};
