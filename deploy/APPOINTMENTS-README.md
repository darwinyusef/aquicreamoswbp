# Sistema de Gestión de Citas con SQLite

## Resumen de Cambios

Se ha implementado un sistema completo de gestión de citas con las siguientes características:

### 1. ✅ Eliminación del AppointmentModal
- **Archivo eliminado**: `/src/components/AppointmentModal.astro`
- El modal separado ya no es necesario porque el formulario principal en `/src/pages/primera-sesion.astro` ya cuenta con un calendario integrado.

### 2. ✅ Restricciones del Calendario

El calendario ahora bloquea automáticamente:

#### a) **Fines de Semana**
- Sábados y domingos están deshabilitados
- Se muestran con un estilo visual diferente (gris oscuro)

#### b) **Días Festivos Colombianos**
- Lista completa de festivos 2025-2026 incluida
- Los días festivos se muestran con un fondo rojizo
- Tooltip que indica "Día festivo" al pasar el mouse

#### c) **Citas Ya Reservadas**
- Se cargan dinámicamente desde la base de datos SQLite
- Los horarios ocupados no se pueden seleccionar
- Se actualizan en tiempo real

### 3. ✅ Base de Datos SQLite

**Archivo**: `/src/lib/db.ts`

#### Esquema de la tabla `appointments`:
```sql
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  service TEXT NOT NULL,
  project_type TEXT,
  project_stage TEXT,
  budget TEXT,
  timeline TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'confirmed'
)
```

#### Funciones disponibles:
- `create(appointment)` - Crear nueva cita
- `getOccupiedSlots()` - Obtener slots ocupados
- `isSlotAvailable(date, time)` - Verificar disponibilidad
- `getAppointmentsByDate(date)` - Citas de una fecha
- `getById(id)` - Obtener cita por ID
- `getByEmail(email)` - Citas de un email
- `updateStatus(id, status)` - Actualizar estado
- `cancel(id)` - Cancelar cita
- `getStats()` - Estadísticas

### 4. ✅ API Endpoints

#### GET `/api/get-occupied-slots.json`
Retorna todos los slots ocupados desde la base de datos.

**Respuesta**:
```json
{
  "success": true,
  "data": [
    { "date": "2025-12-26", "time": "10:00" },
    { "date": "2025-12-26", "time": "14:00" }
  ]
}
```

#### POST `/api/send-appointment.json`
Guarda una nueva cita en la base de datos y opcionalmente envía email.

**Request**:
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+57 300 123 4567",
  "company": "Mi Empresa SAS",
  "date": "2025-12-27",
  "time": "10:00",
  "service": "Desarrollo de Agentes de IA",
  "project_type": "ai_integration",
  "project_stage": "idea",
  "budget": "10k_25k",
  "timeline": "1_2_months",
  "description": "Necesito integrar IA en mi aplicación"
}
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Cita agendada exitosamente. Recibirás confirmación por email.",
  "appointment": { ... }
}
```

**Respuesta de error (slot ocupado)**:
```json
{
  "success": false,
  "error": "Este horario ya no está disponible. Por favor, selecciona otro."
}
```

### 5. ✅ Modal de Confirmación

**Archivo**: `/src/components/SuccessModal.astro`

Modal que se muestra en el home después de agendar una cita exitosamente.

#### Características:
- **Diseño atractivo** con gradientes y animaciones
- **Información completa** de la cita agendada
- **Próximos pasos** claramente definidos
- **Cierre múltiple**: botón, ESC, o click fuera
- **Integración automática** con Layout.astro

#### Cómo funciona:
1. Al confirmar cita en `/primera-sesion`, los datos se guardan en `localStorage` con key `appointmentSuccess`
2. Al cargar cualquier página (incluyendo home), el modal verifica si existe esa key
3. Si existe, muestra el modal automáticamente con los datos
4. Al cerrar, limpia el localStorage

### 6. ✅ Integración Frontend

**Archivo**: `/src/pages/primera-sesion.astro`

#### Cambios principales:

1. **Carga dinámica de slots ocupados**:
```javascript
async function loadOccupiedSlots() {
  const response = await fetch('/api/get-occupied-slots.json');
  const result = await response.json();
  if (result.success) {
    occupiedSlots = result.data;
  }
}
```

2. **Validación de días festivos**:
```javascript
function isHoliday(date) {
  const dateStr = date.toISOString().split('T')[0];
  return colombianHolidays.includes(dateStr);
}
```

3. **Calendario con todas las restricciones**:
```javascript
for (let day = 1; day <= daysInMonth; day++) {
  const dayDate = new Date(year, month, day);
  const isPast = dayDate < today;
  const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
  const isHolidayDate = isHoliday(dayDate);

  if (isPast) {
    // Deshabilitar días pasados
  } else if (isWeekend) {
    // Deshabilitar fines de semana
  } else if (isHolidayDate) {
    // Deshabilitar festivos
  } else {
    // Día seleccionable
  }
}
```

4. **Confirmación de cita con API**:
```javascript
const response = await fetch('/api/send-appointment.json', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bookingData)
});
```

## Instalación

1. Instalar dependencias:
```bash
npm install better-sqlite3
```

2. La base de datos se crea automáticamente en `appointments.db` al ejecutar el proyecto.

## Uso

### Desarrollo
```bash
npm run dev
```

La base de datos SQLite se creará automáticamente en la raíz del proyecto (`appointments.db`).

### Producción

En producción, asegúrate de:

1. **Configurar variables de entorno** para el servicio de email (opcional):
```env
EMAILJS_API_KEY=tu_api_key
# o
RESEND_API_KEY=tu_api_key
```

2. **Hacer backup de la base de datos** periódicamente:
```bash
cp appointments.db appointments_backup_$(date +%Y%m%d).db
```

3. **Verificar permisos** del archivo de base de datos para que el servidor pueda escribir.

## Flujo Completo

1. **Usuario accede** a `/primera-sesion`
2. **Completa cuestionario** de 10 preguntas
3. **IA clasifica** el tipo de servicio recomendado
4. **Calendario se carga** con:
   - Slots ocupados desde BD
   - Días festivos bloqueados
   - Fines de semana bloqueados
   - Días pasados bloqueados
5. **Usuario selecciona** fecha y hora disponible
6. **Sistema verifica** disponibilidad en tiempo real
7. **Cita se guarda** en SQLite
8. **(Opcional)** Email de confirmación se envía
9. **Datos se guardan** en localStorage
10. **Redirige al home** (`/`)
11. **Modal de éxito** se muestra automáticamente con:
    - Email de confirmación
    - Fecha y hora de la cita
    - Servicio seleccionado
    - Próximos pasos
12. **Usuario cierra modal** y continúa navegando

## Días Festivos Incluidos

### 2025
- Año Nuevo, Reyes Magos, San José, Semana Santa, Día del Trabajo
- Ascensión, Corpus Christi, Sagrado Corazón, San Pedro y San Pablo
- Independencia, Batalla de Boyacá, Asunción de la Virgen
- Día de la Raza, Todos los Santos, Independencia de Cartagena
- Inmaculada Concepción, Navidad

### 2026
- Mismos festivos ajustados al año 2026

## Mantenimiento

### Ver citas en la base de datos
```bash
sqlite3 appointments.db
sqlite> SELECT * FROM appointments;
sqlite> .quit
```

### Agregar más festivos
Editar el array `colombianHolidays` en `/src/pages/primera-sesion.astro`:
```javascript
const colombianHolidays = [
  '2027-01-01', // Año Nuevo 2027
  // ... agregar más
];
```

### Exportar citas a CSV
```bash
sqlite3 appointments.db
sqlite> .headers on
sqlite> .mode csv
sqlite> .output appointments.csv
sqlite> SELECT * FROM appointments;
sqlite> .quit
```

## Seguridad

- ✅ Validación de slots antes de guardar
- ✅ Prevención de double-booking
- ✅ Sanitización de inputs
- ✅ Manejo de errores robusto
- ✅ Usuario no-root en Docker (si aplica)

## Próximos Pasos (Opcionales)

1. **Sistema de recordatorios** por email 24h antes
2. **Panel de administración** para ver/gestionar citas
3. **Cancelación de citas** con link único
4. **Integración con Google Calendar**
5. **Zoom/Meet links automáticos**
6. **Notificaciones SMS** vía Twilio
7. **Analytics** de conversión de citas

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0.0
