// components/StepImagePicker.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickAndUploadImage, ImageUploadResult } from '../utils/imageUpload';

interface StepImagePickerProps {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  placeholder?: string;
}

const StepImagePicker: React.FC<StepImagePickerProps> = ({
  imageUrl,
  onImageUrlChange,
  placeholder = "URL de imagen (opcional)"
}) => {
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    try {
      setUploading(true);
      
      const result: ImageUploadResult = await pickAndUploadImage();
      
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
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={imageUrl}
          onChangeText={onImageUrlChange}
          editable={!uploading}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity
          style={[styles.galleryButton, uploading && styles.galleryButtonDisabled]}
          onPress={handlePickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="images" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
      
      {imageUrl && imageUrl.trim() !== '' && (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.previewImage}
          onError={() => console.log('Error loading step image')}
        />
      )}
      
      {uploading && (
        <Text style={styles.uploadingText}>Subiendo imagen...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 6,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  galleryButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
  },
  galleryButtonDisabled: {
    backgroundColor: '#ccc',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    marginTop: 8,
    backgroundColor: '#f0f0f0',
  },
  uploadingText: {
    fontSize: 12,
    color: '#007BFF',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default StepImagePicker;
