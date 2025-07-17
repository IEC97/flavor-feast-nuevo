# 📸 Configuración de Subida de Imágenes

Tu app ahora puede subir imágenes desde la galería del usuario automáticamente. Aquí te explico cómo configurarlo:

## 🚀 ¿Qué se implementó?

- **Selector de imágenes**: Los usuarios pueden elegir fotos de su galería
- **Subida automática**: Las imágenes se suben a un servicio en la nube
- **URL automática**: Se genera una URL que se guarda en la base de datos
- **Dos componentes**:
  - `ImagePickerComponent`: Para la imagen principal de la receta
  - `StepImagePicker`: Para imágenes de los pasos

## ⚙️ Configuración Requerida

### Opción 1: ImgBB (Recomendado - Más fácil)

1. **Crear cuenta**: Ve a https://api.imgbb.com/
2. **Registro gratuito**: 500 MB de almacenamiento gratis
3. **Obtener API Key**:
   - Inicia sesión
   - Ve a la sección "API" 
   - Copia tu API key
4. **Configurar**: 
   - Abre `config/imageUploadConfig.ts`
   - Reemplaza `'tu_api_key_aqui'` con tu API key real

```typescript
export const IMGBB_CONFIG = {
  API_KEY: 'tu_api_key_real_aqui', // ← Reemplaza esto
  // ... resto de la configuración
};
```

### Opción 2: Cloudinary (Alternativa - Más funciones)

1. **Crear cuenta**: Ve a https://cloudinary.com/
2. **Registro gratuito**: 25 GB de almacenamiento gratis
3. **Obtener configuración**:
   - En el dashboard, copia tu "Cloud Name"
   - Ve a Settings > Upload
   - Crea un "Upload Preset" (modo "Unsigned")
4. **Configurar**:
   - Abre `config/imageUploadConfig.ts`
   - Reemplaza los valores en `CLOUDINARY_CONFIG`

```typescript
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: 'tu_cloud_name_real', // ← Reemplaza esto
  UPLOAD_PRESET: 'tu_upload_preset_real', // ← Y esto
  // ... resto de la configuración
};
```

## 🔧 Cambiar Servicio

Para cambiar entre ImgBB y Cloudinary, modifica esta línea en `config/imageUploadConfig.ts`:

```typescript
export const IMAGE_UPLOAD_SERVICE: 'imgbb' | 'cloudinary' = 'imgbb';
//                                                            ↑ 
//                                        Cambia a 'cloudinary' si prefieres
```

## 📱 Cómo funciona para el usuario

1. **En RecipeFormScreen**: 
   - Ve una vista previa de la imagen
   - Puede tocar "Galería" para seleccionar una foto
   - También puede ingresar una URL manualmente

2. **En RecipeStepsScreen**:
   - Cada paso tiene un campo de imagen opcional
   - Botón pequeño de galería al lado del campo de texto
   - Vista previa automática si se sube una imagen

## 🔍 Solución de Problemas

### Error: "API key no configurada"
- Verifica que hayas reemplazado la API key en `config/imageUploadConfig.ts`
- Asegúrate de que la API key sea válida

### Error: "No se pudo subir imagen"
- Verifica tu conexión a internet
- Revisa que el servicio elegido esté bien configurado
- Checa los logs de la consola para más detalles

### La imagen no se muestra
- Verifica que la URL generada sea accesible
- Algunos servicios tienen URLs que expiran
- ImgBB: las imágenes duran 6 meses por defecto

## 💡 Consejos

- **ImgBB**: Más simple de configurar, perfecto para empezar
- **Cloudinary**: Más profesional, incluye redimensionamiento automático
- **URLs manuales**: Los usuarios aún pueden ingresar URLs si prefieren
- **Compresión**: Las imágenes se comprimen automáticamente para subida más rápida

## 🔒 Seguridad

- Las API keys están en el cliente (frontend)
- Para producción, considera implementar un proxy en tu backend
- Los servicios gratuitos tienen límites de uso

---

Una vez configurado cualquiera de los dos servicios, ¡los usuarios podrán subir imágenes directamente desde su galería! 📸
