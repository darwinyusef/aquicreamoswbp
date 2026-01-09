import type { APIRoute } from 'astro';
import { appointmentsDb } from '../../lib/db';

export const prerender = false;

const BACKEND_URL = import.meta.env.BACKEND_URL || 'http://localhost:3001';

interface AppointmentData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  type?: string;
  description?: string;
  date: string;
  time: string;
  service: string;
  project_type?: string;
  project_stage?: string;
  budget?: string;
  timeline?: string;
  expected_users?: string;
  features?: string | string[];
  tech_preferences?: string;
  has_team?: string;
  priority?: string;
  chatConversation?: string;
}

export const POST: APIRoute = async ({ request }) => {
  console.log('📧 API /send-appointment llamada');

  try {
    const body = await request.json();
    const appointmentData: AppointmentData = body;

    // Validaciones
    if (!appointmentData.name || !appointmentData.email || !appointmentData.date || !appointmentData.time) {
      return new Response(
        JSON.stringify({
          error: 'Faltan datos requeridos',
          success: false
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si el slot está disponible
    const isAvailable = appointmentsDb.isSlotAvailable(appointmentData.date, appointmentData.time);
    if (!isAvailable) {
      return new Response(
        JSON.stringify({
          error: 'Este horario ya no está disponible. Por favor, selecciona otro.',
          success: false
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Guardar en la base de datos
    let appointmentId: number;
    try {
      appointmentId = appointmentsDb.create({
        name: appointmentData.name,
        email: appointmentData.email,
        phone: appointmentData.phone,
        company: appointmentData.company,
        date: appointmentData.date,
        time: appointmentData.time,
        service: appointmentData.service || getTypeLabel(appointmentData.type || ''),
        advisory_type: appointmentData.advisory_type,
        project_type: appointmentData.project_type,
        project_stage: appointmentData.project_stage,
        budget: appointmentData.budget,
        timeline: appointmentData.timeline,
        expected_users: appointmentData.expected_users,
        features: Array.isArray(appointmentData.features)
          ? appointmentData.features.join(', ')
          : appointmentData.features,
        tech_preferences: appointmentData.tech_preferences,
        has_team: appointmentData.has_team,
        priority: appointmentData.priority,
        description: appointmentData.description,
        status: 'confirmed'
      });

      console.log(`✅ Cita guardada en BD con ID: ${appointmentId}`);
    } catch (dbError) {
      console.error('❌ Error al guardar en base de datos:', dbError);
      return new Response(
        JSON.stringify({
          error: 'Error al guardar la cita',
          success: false
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enviar datos al backend de portfolio para email + calendar
    let calendarEventId: string | null = null;
    let meetLink: string | null = null;

    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: appointmentData.name,
          email: appointmentData.email,
          phone: appointmentData.phone,
          company: appointmentData.company,
          date: appointmentData.date,
          time: appointmentData.time,
          service: appointmentData.service,
          project_type: appointmentData.project_type,
          project_stage: appointmentData.project_stage,
          budget: appointmentData.budget,
          timeline: appointmentData.timeline,
          expected_users: appointmentData.expected_users,
          features: appointmentData.features,
          tech_preferences: appointmentData.tech_preferences,
          has_team: appointmentData.has_team,
          priority: appointmentData.priority,
          description: appointmentData.description,
        }),
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        calendarEventId = backendData.data?.calendarEventId || null;
        meetLink = backendData.data?.meetLink || null;

        // Actualizar BD con el calendar_event_id
        if (calendarEventId) {
          appointmentsDb.updateCalendarEventId(appointmentId, calendarEventId);
        }

        console.log('✅ Backend procesado exitosamente:', {
          adminEmailId: backendData.data?.adminEmailId,
          clientEmailId: backendData.data?.clientEmailId,
          calendarEventId,
          meetLink,
        });
      } else {
        const errorData = await backendResponse.json();
        console.error('⚠️ Error en backend:', errorData);
      }
    } catch (backendError) {
      console.error('❌ Error al comunicarse con el backend:', backendError);
      // Continuamos aunque falle el backend (la cita ya está guardada en BD)
    }

    // Retornar respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Asesoría agendada exitosamente. Recibirás confirmación por email.',
        data: {
          id: appointmentId,
          date: appointmentData.date,
          time: appointmentData.time,
          service: appointmentData.service,
          calendarEventCreated: !!calendarEventId,
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error en /api/send-appointment:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'new_project': 'Tengo una idea nueva',
    'improve_existing': 'Mejorar lo que tengo',
    'scale_business': 'Crecer mi negocio',
    'ai_integration': 'Usar Inteligencia Artificial',
    'fix_problems': 'Resolver problemas',
    'guide_team': 'Guiar mi equipo técnico',
    'project_stuck': 'Mi proyecto está estancado',
    'limited_budget': 'Tengo presupuesto limitado',
    'validate_idea': 'Validar mi idea de negocio',
    'migrate_tech': 'Actualizar tecnología antigua',
    'security': 'Mejorar la seguridad',
    'integration': 'Conectar mis sistemas',
    'not_sure': 'No estoy seguro'
  };
  return labels[type] || type;
}
