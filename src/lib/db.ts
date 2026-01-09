import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ruta de la base de datos - configurable por variable de entorno
const dbPath = process.env.DB_PATH || join(__dirname, '../../appointments.db');

// Asegurar que el directorio existe
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

console.log(`📂 Base de datos SQLite: ${dbPath}`);

const db = new Database(dbPath);

// Crear tabla de citas si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    company TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    service TEXT NOT NULL,
    advisory_type TEXT,
    project_type TEXT,
    project_stage TEXT,
    budget TEXT,
    timeline TEXT,
    expected_users TEXT,
    features TEXT,
    tech_preferences TEXT,
    has_team TEXT,
    priority TEXT,
    description TEXT,
    calendar_event_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'confirmed'
  )
`);

// Crear índices para búsquedas rápidas
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_date_time ON appointments(date, time);
  CREATE INDEX IF NOT EXISTS idx_email ON appointments(email);
  CREATE INDEX IF NOT EXISTS idx_status ON appointments(status);
`);

export interface Appointment {
  id?: number;
  name: string;
  email: string;
  phone: string;
  company?: string;
  date: string;
  time: string;
  service: string;
  advisory_type?: string;
  project_type?: string;
  project_stage?: string;
  budget?: string;
  timeline?: string;
  expected_users?: string;
  features?: string;
  tech_preferences?: string;
  has_team?: string;
  priority?: string;
  description?: string;
  calendar_event_id?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
}

export interface OccupiedSlot {
  date: string;
  time: string;
}

export const appointmentsDb = {
  // Crear una nueva cita
  create(appointment: Appointment): number {
    const stmt = db.prepare(`
      INSERT INTO appointments (
        name, email, phone, company, date, time, service, advisory_type,
        project_type, project_stage, budget, timeline,
        expected_users, features, tech_preferences, has_team, priority,
        description, calendar_event_id, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      appointment.name,
      appointment.email,
      appointment.phone,
      appointment.company || null,
      appointment.date,
      appointment.time,
      appointment.service,
      appointment.advisory_type || null,
      appointment.project_type || null,
      appointment.project_stage || null,
      appointment.budget || null,
      appointment.timeline || null,
      appointment.expected_users || null,
      appointment.features || null,
      appointment.tech_preferences || null,
      appointment.has_team || null,
      appointment.priority || null,
      appointment.description || null,
      appointment.calendar_event_id || null,
      appointment.status || 'confirmed'
    );

    return result.lastInsertRowid as number;
  },

  // Actualizar calendar_event_id
  updateCalendarEventId(id: number, calendarEventId: string): boolean {
    const stmt = db.prepare(`
      UPDATE appointments
      SET calendar_event_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(calendarEventId, id);
    return result.changes > 0;
  },

  // Obtener todos los slots ocupados
  getOccupiedSlots(): OccupiedSlot[] {
    const stmt = db.prepare(`
      SELECT date, time
      FROM appointments
      WHERE status = 'confirmed'
      ORDER BY date, time
    `);

    return stmt.all() as OccupiedSlot[];
  },

  // Verificar si un slot está disponible
  isSlotAvailable(date: string, time: string): boolean {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM appointments
      WHERE date = ? AND time = ? AND status = 'confirmed'
    `);

    const result = stmt.get(date, time) as { count: number };
    return result.count === 0;
  },

  // Obtener todas las citas de una fecha específica
  getAppointmentsByDate(date: string): Appointment[] {
    const stmt = db.prepare(`
      SELECT *
      FROM appointments
      WHERE date = ? AND status = 'confirmed'
      ORDER BY time
    `);

    return stmt.all(date) as Appointment[];
  },

  // Obtener una cita por ID
  getById(id: number): Appointment | undefined {
    const stmt = db.prepare(`
      SELECT * FROM appointments WHERE id = ?
    `);

    return stmt.get(id) as Appointment | undefined;
  },

  // Obtener citas por email
  getByEmail(email: string): Appointment[] {
    const stmt = db.prepare(`
      SELECT * FROM appointments
      WHERE email = ?
      ORDER BY date DESC, time DESC
    `);

    return stmt.all(email) as Appointment[];
  },

  // Actualizar estado de una cita
  updateStatus(id: number, status: string): boolean {
    const stmt = db.prepare(`
      UPDATE appointments
      SET status = ?
      WHERE id = ?
    `);

    const result = stmt.run(status, id);
    return result.changes > 0;
  },

  // Cancelar una cita
  cancel(id: number): boolean {
    return this.updateStatus(id, 'cancelled');
  },

  // Obtener estadísticas
  getStats() {
    const totalStmt = db.prepare(`
      SELECT COUNT(*) as total FROM appointments
    `);
    const confirmedStmt = db.prepare(`
      SELECT COUNT(*) as confirmed FROM appointments WHERE status = 'confirmed'
    `);
    const cancelledStmt = db.prepare(`
      SELECT COUNT(*) as cancelled FROM appointments WHERE status = 'cancelled'
    `);

    return {
      total: (totalStmt.get() as { total: number }).total,
      confirmed: (confirmedStmt.get() as { confirmed: number }).confirmed,
      cancelled: (cancelledStmt.get() as { cancelled: number }).cancelled,
    };
  },
};

export default db;
