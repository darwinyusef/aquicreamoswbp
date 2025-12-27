# Changelog - Sistema de Citas v1.0

## Fecha: Diciembre 2024

### ✅ Implementaciones Completadas

#### 1. Eliminación de AppointmentModal
- **Archivos eliminados:**
  - `/src/components/AppointmentModal.astro`
- **Archivos modificados:**
  - `/src/layouts/Layout.astro` - Removida importación
  - `/src/components/Asesorias.astro` - Removida lógica de modal, ahora redirige a `/primera-sesion`

**Motivo:** El formulario principal en `/primera-sesion` ya contaba con un calendario completo e integrado.

---

#### 2. Restricciones del Calendario

##### a) **Fines de Semana** ✅
- Automáticamente bloqueados (sábados y domingos)
- Código en `/src/pages/primera-sesion.astro` líneas 768-780

##### b) **Días Festivos Colombianos 2025-2026** ✅
- Lista completa de 36 festivos incluida
- Código en líneas 598-644
- Estilo visual distintivo (rojo)
- Tooltip informativo

##### c) **Citas Ya Reservadas** ✅
- Cargadas dinámicamente desde SQLite
- API endpoint: `/api/get-occupied-slots.json`
- Actualización en tiempo real
- Prevención de double-booking

---

#### 3. Backend SQLite

##### Archivos Creados:

**`/src/lib/db.ts`**
- Configuración de SQLite con better-sqlite3
- Tabla `appointments` con campos completos
- Funciones CRUD:
  - `create()` - Crear cita
  - `getOccupiedSlots()` - Slots ocupados
  - `isSlotAvailable()` - Verificar disponibilidad
  - `getAppointmentsByDate()` - Citas por fecha
  - `getById()` - Obtener por ID
  - `getByEmail()` - Citas por email
  - `updateStatus()` - Actualizar estado
  - `cancel()` - Cancelar cita
  - `getStats()` - Estadísticas

**`/src/pages/api/get-occupied-slots.json.ts`**
- Endpoint GET para obtener slots ocupados
- Retorna array con `{ date, time }`

**Modificado: `/src/pages/api/send-appointment.json.ts`**
- Ahora guarda en SQLite antes de enviar email
- Verifica disponibilidad del slot
- Retorna error 409 si slot ocupado
- Logs detallados en consola para desarrollo

---

#### 4. Modal de Confirmación

**Archivo Creado: `/src/components/SuccessModal.astro`**

##### Características:
- ✅ Diseño profesional con gradientes
- ✅ Animación de entrada suave
- ✅ Muestra información completa:
  - Email del cliente
  - Fecha y hora formateadas
  - Servicio seleccionado
  - Próximos pasos
- ✅ Múltiples formas de cierre:
  - Botón "Entendido"
  - Tecla ESC
  - Click fuera del modal
- ✅ Auto-limpieza de localStorage

##### Integración:
- Agregado a `/src/layouts/Layout.astro`
- Se activa automáticamente en home después de agendar
- Usa localStorage con key `appointmentSuccess`

---

#### 5. Flujo Completo Actualizado

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario llena formulario en /asesorias o /primera-sesion│
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Datos se guardan en localStorage                         │
│    → Redirige a /primera-sesion                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Usuario completa cuestionario de 10 preguntas            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. IA clasifica el tipo de servicio                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Calendario se carga con restricciones:                   │
│    ✓ Slots ocupados (desde SQLite)                          │
│    ✓ Días festivos (lista hardcoded)                        │
│    ✓ Fines de semana                                        │
│    ✓ Días pasados                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Usuario selecciona fecha y hora disponible               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Sistema verifica disponibilidad en tiempo real           │
│    POST /api/send-appointment.json                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Cita se guarda en SQLite                                 │
│    ✓ appointments.db                                        │
│    ✓ ID auto-incrementado                                   │
│    ✓ Status: 'confirmed'                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Email de confirmación se envía (opcional)                │
│    ⚠️ Requiere configurar EMAILJS_API_KEY o RESEND_API_KEY │
│    ✓ En desarrollo: solo muestra en consola                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Datos se guardan en localStorage                        │
│     Key: 'appointmentSuccess'                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. Redirige al home (/)                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 12. Modal de éxito se muestra automáticamente               │
│     ✓ Mensaje de confirmación                               │
│     ✓ Detalles de la cita                                   │
│     ✓ Próximos pasos                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 13. Usuario cierra modal y continúa navegando               │
│     → localStorage se limpia automáticamente                │
└─────────────────────────────────────────────────────────────┘
```

---

## Archivos Modificados

### Core
- `/src/lib/db.ts` - NUEVO
- `/src/components/SuccessModal.astro` - NUEVO
- `/src/pages/api/get-occupied-slots.json.ts` - NUEVO

### Modificados
- `/src/pages/api/send-appointment.json.ts` - Integración SQLite
- `/src/pages/primera-sesion.astro` - Restricciones calendario + redirección con modal
- `/src/layouts/Layout.astro` - Agregado SuccessModal
- `/src/components/Asesorias.astro` - Simplificado (sin modal)

### Eliminados
- `/src/components/AppointmentModal.astro` - YA NO SE USA

---

## Base de Datos

### Esquema
```sql
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  date TEXT NOT NULL,        -- Format: 'YYYY-MM-DD'
  time TEXT NOT NULL,        -- Format: 'HH:MM'
  service TEXT NOT NULL,
  project_type TEXT,
  project_stage TEXT,
  budget TEXT,
  timeline TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'confirmed'  -- 'confirmed', 'cancelled', etc.
)
```

### Índices
```sql
CREATE INDEX idx_date_time ON appointments(date, time);
CREATE INDEX idx_email ON appointments(email);
CREATE INDEX idx_status ON appointments(status);
```

### Ubicación
- Archivo: `appointments.db` (raíz del proyecto)
- Se crea automáticamente al iniciar

---

## Configuración de Email

### Variables de Entorno (.env)
```env
# Opción 1: EmailJS
EMAILJS_API_KEY=tu_key_aqui

# Opción 2: Resend
RESEND_API_KEY=tu_key_aqui
```

### Modo Desarrollo
Si no hay API key configurada:
- ✅ Cita se guarda en SQLite
- ✅ Datos se muestran en consola
- ✅ Modal de éxito se muestra
- ❌ No se envía email

### Modo Producción
Con API key configurada:
- ✅ Cita se guarda en SQLite
- ✅ Email de confirmación se envía
- ✅ Modal de éxito se muestra
- ✅ Cliente recibe email

---

## Testing

### Verificar citas en BD
```bash
sqlite3 appointments.db
sqlite> SELECT * FROM appointments;
sqlite> SELECT date, time, name, service FROM appointments WHERE status='confirmed';
sqlite> .quit
```

### Simular cita agendada (desarrollo)
```javascript
// Ejecutar en consola del navegador en home
localStorage.setItem('appointmentSuccess', JSON.stringify({
  email: 'test@example.com',
  date: '2025-12-30',
  time: '10:00',
  service: 'Desarrollo de Agentes de IA',
  name: 'Test User'
}));
location.reload();
```

---

## Próximas Mejoras Sugeridas

1. **Panel de Administración**
   - Ver todas las citas
   - Cancelar/Reagendar
   - Exportar a CSV/Excel

2. **Notificaciones**
   - Recordatorio 24h antes (email/SMS)
   - Confirmación automática

3. **Integración Calendario**
   - Google Calendar
   - Outlook Calendar
   - iCal export

4. **Métricas**
   - Dashboard de estadísticas
   - Tasa de conversión
   - Horarios más populares

5. **Experiencia de Usuario**
   - Reagendar desde email
   - Cancelar desde link único
   - Agregar a calendario (botón .ics)

---

## Dependencias Nuevas

```json
{
  "dependencies": {
    "better-sqlite3": "^11.8.0"
  }
}
```

## Instalación
```bash
npm install better-sqlite3
```

---

**Versión:** 1.0.0
**Fecha:** Diciembre 2024
**Estado:** ✅ Producción Ready (sin email configurado)
