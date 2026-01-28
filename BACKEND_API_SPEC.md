# Backend API Specification

Este documento especifica todos los endpoints que deben existir en el backend (`darwinyusef.portfolio/backend`) para que el frontend funcione correctamente.

## 🌐 Base URL

```
BACKEND_URL (configurado en GitHub Secrets)
Ejemplo: http://localhost:3001 o https://api.ejemplo.com
```

## 📡 Endpoints Requeridos

### 1. Chat Assistant (OpenAI Proxy)

**Endpoint:** `POST /api/chat`

**Descripción:** Procesa mensajes del chatbot y devuelve respuestas de OpenAI

**Request Body:**
```json
{
  "question": "string",
  "conversationHistory": [
    {
      "role": "user" | "assistant",
      "content": "string"
    }
  ],
  "context": "string (opcional: global, consulta-ia, etc)",
  "serviceContext": {
    "serviceName": "string (opcional)",
    "serviceDescription": "string (opcional)"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "string (respuesta de OpenAI)"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "string"
}
```

---

### 2. Bug Reports

**Endpoint:** `POST /api/bug-reports`

**Descripción:** Recibe reportes de bugs del frontend y los procesa (email, almacenamiento, etc)

**Request Body:**
```json
{
  "type": "bug" | "suggestion" | "improvement",
  "page": "string",
  "title": "string",
  "description": "string",
  "email": "string (opcional)",
  "timestamp": "string",
  "userAgent": "string",
  "screenSize": "string",
  "url": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reporte enviado exitosamente"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "string"
}
```

---

### 3. Appointments - Crear Cita

**Endpoint:** `POST /api/appointments`

**Descripción:** Crea una nueva cita, verifica disponibilidad, envía emails y crea evento en Google Calendar

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "company": "string (opcional)",
  "date": "string (YYYY-MM-DD)",
  "time": "string (HH:MM)",
  "service": "string",
  "project_type": "string (opcional)",
  "project_stage": "string (opcional)",
  "budget": "string (opcional)",
  "timeline": "string (opcional)",
  "expected_users": "string (opcional)",
  "features": "string[] | string (opcional)",
  "tech_preferences": "string (opcional)",
  "has_team": "string (opcional)",
  "priority": "string (opcional)",
  "description": "string (opcional)",
  "type": "string (opcional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Asesoría agendada exitosamente. Recibirás confirmación por email.",
  "data": {
    "id": "number | string",
    "date": "string",
    "time": "string",
    "service": "string",
    "calendarEventId": "string (opcional)",
    "meetLink": "string (opcional)",
    "adminEmailId": "string (opcional)",
    "clientEmailId": "string (opcional)"
  }
}
```

**Error Response (409 - Slot no disponible):**
```json
{
  "success": false,
  "error": "Este horario ya no está disponible. Por favor, selecciona otro."
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Faltan datos requeridos"
}
```

---

### 4. Appointments - Obtener Slots Ocupados

**Endpoint:** `GET /api/appointments/occupied-slots`

**Descripción:** Devuelve todos los horarios ya ocupados para evitar doble reserva

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "string (YYYY-MM-DD)",
      "time": "string (HH:MM)"
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "string"
}
```

---

### 5. Service Classifier (TensorFlow/ML)

**Endpoint:** `POST /api/classify-service`

**Descripción:** Clasifica el tipo de servicio necesario basado en las respuestas del usuario

**Request Body:**
```json
{
  "project_type": "string",
  "project_stage": "string",
  "budget": "string",
  "timeline": "string",
  "expected_users": "string",
  "features": ["string"],
  "has_team": "string",
  "priority": "string",
  "description": "string (opcional)"
}
```

**Response:**
```json
{
  "success": true,
  "classification": {
    "service": "string (Desarrollo Web/API | Desarrollo Móvil | Integración de IA | Revisión de Arquitectura | Consultoría General)",
    "confidence": "number (0-1)",
    "recommendations": ["string"],
    "estimatedDuration": "string",
    "suggestedApproach": "string"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "string"
}
```

---

## 🔒 Variables de Entorno Requeridas en Backend

El backend debe tener configuradas:

```env
OPENAI_API_KEY=sk-...              # Para el chatbot
GOOGLE_CALENDAR_CREDENTIALS=...    # Para eventos de citas
EMAIL_SERVICE_CONFIG=...           # Para envío de emails
DATABASE_URL=...                   # Para almacenamiento de citas
```

---

## 📝 Notas de Implementación

### Seguridad
- Todas las requests deben validar los datos de entrada
- Implementar rate limiting para evitar abuso
- Sanitizar inputs para prevenir XSS/SQL injection

### CORS
- El backend debe permitir requests desde el dominio del frontend
- Configurar headers CORS apropiados

### Logging
- Loguear todas las requests para debugging
- No loguear información sensible (API keys, passwords)

### Error Handling
- Siempre devolver JSON con `success: boolean`
- Incluir mensajes de error descriptivos
- Usar códigos HTTP apropiados:
  - 200: Success
  - 400: Bad Request (datos inválidos)
  - 404: Not Found
  - 409: Conflict (slot ocupado)
  - 500: Server Error
  - 503: Service Unavailable

---

## 🧪 Testing

Para cada endpoint, el backend debe incluir:
- Unit tests
- Integration tests
- Tests de validación de datos
- Tests de manejo de errores

---

## 🚀 Migración del Modelo TensorFlow

El archivo `src/lib/model_tf_classifier.ts` contiene la lógica del modelo de clasificación.

**Opciones:**

1. **Mover al backend (RECOMENDADO):**
   - Copiarlo al backend y adaptarlo para Node.js
   - Usar `@tensorflow/tfjs-node` en lugar de `@tensorflow/tfjs`
   - Más control y posibilidad de entrenar con datos reales

2. **Mantener en frontend:**
   - Cambiar el endpoint `/api/classify-service` para que sea un endpoint Astro local
   - Mantener la ejecución en el servidor Astro SSR
   - Menos flexible pero funcional

Se recomienda la **opción 1** para mayor consistencia con la arquitectura.
