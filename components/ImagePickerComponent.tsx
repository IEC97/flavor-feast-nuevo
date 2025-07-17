// components/ImagePickerComponent.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickAndUploadImage, ImageUploadResult } from '../utils/imageUpload';

interface ImagePickerComponentProps {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  placeholder?: string;
  required?: boolean;
}

const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  imageUrl,
  onImageUrlChange,
  placeholder = "URL de imagen o selecciona de la galería",
  required = false
}) => {
  const [uploading, setUploading] = useState(false);

  const getImageSource = () => {
    if (imageUrl.trim()) {
      return { uri: imageUrl };
    }
    return require('../assets/placeholder.jpg');
  };

  const handlePickImage = async () => {
    try {
      setUploading(true);
      
      const result: ImageUploadResult = await pickAndUploadImage(); // Usa la configuración por defecto
      
      if (result.success && result.url) {
        onImageUrlChange(result.url);
        Alert.alert('Éxito', 'Imagen subida correctamente');
      } else {
        Alert.alert('Error', result.error || 'No se pudo subir la imagen');
      }
    } catch (error) {
      Alert.alert('Error', `Error al subir imagen: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Imagen de la receta {required && '*'}
      </Text>
      
      {/* Vista previa de la imagen */}
      <View style={styles.imageContainer}>
        <Image source={getImageSource()} style={styles.imagePreview} />
        
        {/* Overlay con botones */}
        <View style={styles.imageOverlay}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handlePickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="images" size={24} color="#fff" />
            )}
            <Text style={styles.buttonText}>
              {uploading ? 'Subiendo...' : 'Galería'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Campo de texto para URL manual */}
      <View style={styles.urlInputContainer}>
        <Text style={styles.urlLabel}>O ingresa una URL manualmente:</Text>
        <View style={styles.urlInputWrapper}>
          <Ionicons name="link" size={20} color="#666" style={styles.urlIcon} />
          <TextInput
            style={styles.urlInput}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={imageUrl}
            onChangeText={onImageUrlChange}
            editable={!uploading}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {required && (
        <Text style={styles.helperText}>
          Campo obligatorio. Puedes subir una imagen desde tu galería o ingresar una URL.
        </Text>
      )}
      
      {uploading && (
        <Text style={styles.uploadingText}>
          Subiendo imagen... Por favor espera.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
    color: '#333',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 10,
  },
  galleryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  urlInputContainer: {
    marginTop: 10,
  },
  urlLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  urlInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  urlIcon: {
    marginRight: 8,
  },
  urlInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  uploadingText: {
    fontSize: 12,
    color: '#007BFF',
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ImagePickerComponent;
