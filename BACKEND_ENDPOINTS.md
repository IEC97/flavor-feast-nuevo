# 🚀 Endpoints Requeridos para Panel de Administrador

## 📋 Problema Actual
El panel de administrador está intentando usar endpoints que no están implementados en el backend. El servidor está devolviendo páginas HTML de error de Google Drive en lugar de respuestas JSON.

## 🔗 Endpoints Necesarios

### 1. Listar Todas las Recetas (Administrador)
```
GET {API_BASE_URL}/admin/recipes
```

**Respuesta esperada:**
```json
{
  "status": 200,
  "data": [
    {
      "idReceta": 1,
      "idUsuario": 123,
      "nombre": "Pizza Margherita",
      "descripcion": "Deliciosa pizza italiana...",
      "fecha": "2025-01-15T10:30:00Z",
      "porciones": 4,
      "idTipo": 1,
      "aprobado": true,
      "publicado": true,
      "imagenURL": "https://example.com/image.jpg"
    }
  ]
}
```

### 2. Cambiar Estado de Publicación (Si se implementa en el futuro)
```
POST {API_BASE_URL}/admin/recipes/{id}/publicacion
```

**Body:**
```json
{
  "id": 1,
  "publicado": true
}
```

**Respuesta esperada:**
```json
{
  "status": 200,
  "message": "Estado de publicación actualizado correctamente"
}
```

### 3. Cambiar Estado de Aprobación
```
POST {API_BASE_URL}/admin/recipes/{id}/aprobacion
```

**Body:**
```json
{
  "id": 1,
  "aprobado": true
}
```

**Respuesta esperada:**
```json
{
  "status": 200,
  "message": "Estado de aprobación actualizado correctamente"
}
```

## 🎯 Comportamiento de la App

### Estados de Publicación:
- **Sin publicar** (null/undefined) - 🟠 Naranja
- **Publicada** (true) - 🟢 Verde  
- **Despublicada** (false) - 🔴 Rojo

### Lógica de Fallback:
1. La app intenta usar el endpoint `/publicacion` primero
2. Si falla (404 o devuelve HTML), usa `/aprobacion` como fallback
3. Si ambos fallan, muestra mensaje de endpoint no disponible

## ⚠️ Estado Actual del Problema
```
ERROR: ❌ Error al parsear JSON: <!DOCTYPE html>...
```

**Causa:** El servidor está devolviendo páginas HTML de error en lugar de JSON válido.

**Solución:** Implementar los endpoints mencionados arriba en el backend.

## 🔧 Testing
Una vez implementados los endpoints, la app debería:
1. Cargar todas las recetas en el panel admin
2. Permitir alternar entre publicada/despublicada
3. Mostrar feedback visual del cambio de estado
4. Sincronizar cambios con la base de datos

## 📞 Contacto
Si necesitas más detalles sobre la implementación, revisa el código en:
- `screens/AdminScreen.tsx` - Lógica del panel
- `constants.ts` - URL base de la API
