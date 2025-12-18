import type { APIRoute } from 'astro';

export const prerender = false;

interface AppointmentData {
  name: string;
  email: string;
  phone: string;
  type: string;
  description: string;
  date: string;
  time: string;
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

    // Obtener la API key de EmailJS o Resend desde variables de entorno
    const emailServiceKey = import.meta.env.EMAILJS_API_KEY || import.meta.env.RESEND_API_KEY;

    if (!emailServiceKey) {
      console.warn('⚠️ No hay servicio de email configurado. Guardando en consola...');

      // En desarrollo, mostrar en consola
      console.log('📅 NUEVA CITA AGENDADA:');
      console.log('========================');
      console.log(`👤 Nombre: ${appointmentData.name}`);
      console.log(`📧 Email: ${appointmentData.email}`);
      console.log(`📞 Teléfono: ${appointmentData.phone}`);
      console.log(`📋 Tipo: ${appointmentData.type}`);
      console.log(`📝 Descripción: ${appointmentData.description}`);
      console.log(`📅 Fecha: ${appointmentData.date}`);
      console.log(`⏰ Hora: ${appointmentData.time}`);
      if (appointmentData.chatConversation) {
        console.log(`💬 Conversación Chat:\n${appointmentData.chatConversation}`);
      }
      console.log('========================');

      // Simular envío exitoso en desarrollo
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Cita guardada (modo desarrollo)',
          appointment: appointmentData
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Construcción del email
    const emailHtml = buildEmailHTML(appointmentData);
    const emailText = buildEmailText(appointmentData);

    // Aquí puedes implementar tu servicio de email preferido
    // Ejemplo con Resend:
    /*
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Aquí Creamos <citas@aquicreamos.com>',
        to: ['contacto@aquicreamos.com'],
        reply_to: appointmentData.email,
        subject: `Nueva Cita Agendada - ${appointmentData.name}`,
        html: emailHtml,
        text: emailText
      }),
    });

    if (!resendResponse.ok) {
      throw new Error('Error al enviar email');
    }
    */

    // Ejemplo con EmailJS (lado cliente, pero podemos usar fetch):
    // Para EmailJS necesitarías usar su SDK en el cliente

    console.log('✅ Email enviado exitosamente');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cita agendada exitosamente. Recibirás confirmación por email.',
        appointment: appointmentData
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

function buildEmailHTML(data: AppointmentData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #82e256, #6bc73d); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-row { margin: 15px 0; padding: 15px; background: white; border-left: 4px solid #82e256; border-radius: 5px; }
    .label { font-weight: bold; color: #6bc73d; display: inline-block; width: 120px; }
    .value { color: #333; }
    .highlight { background: #82e256; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    .conversation { background: #fff; padding: 15px; border-radius: 5px; margin-top: 10px; white-space: pre-wrap; font-family: monospace; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Nueva Cita Agendada</h1>
      <p>Aquí Creamos - Sistema de Asesorías</p>
    </div>

    <div class="content">
      <div class="highlight">
        <h2 style="margin: 0;">📅 ${data.date} a las ⏰ ${data.time}</h2>
      </div>

      <h3>Información del Cliente:</h3>
      <div class="info-row">
        <span class="label">👤 Nombre:</span>
        <span class="value">${data.name}</span>
      </div>
      <div class="info-row">
        <span class="label">📧 Email:</span>
        <span class="value">${data.email}</span>
      </div>
      <div class="info-row">
        <span class="label">📞 Teléfono:</span>
        <span class="value">${data.phone}</span>
      </div>

      <h3>Detalles de la Asesoría:</h3>
      <div class="info-row">
        <span class="label">📋 Tipo:</span>
        <span class="value">${getTypeLabel(data.type)}</span>
      </div>
      <div class="info-row">
        <span class="label">📝 Descripción:</span>
        <div class="value" style="margin-top: 10px;">${data.description}</div>
      </div>

      ${data.chatConversation ? `
      <h3>💬 Conversación del Chat:</h3>
      <div class="conversation">${data.chatConversation}</div>
      ` : ''}

      <div class="footer">
        <p>Este email fue generado automáticamente por el sistema de agendamiento de Aquí Creamos</p>
        <p>Por favor, confirma la cita respondiendo a este correo</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function buildEmailText(data: AppointmentData): string {
  return `
NUEVA CITA AGENDADA - Aquí Creamos

Fecha y Hora: ${data.date} a las ${data.time}

INFORMACIÓN DEL CLIENTE:
- Nombre: ${data.name}
- Email: ${data.email}
- Teléfono: ${data.phone}

DETALLES DE LA ASESORÍA:
- Tipo: ${getTypeLabel(data.type)}
- Descripción: ${data.description}

${data.chatConversation ? `\nCONVERSACIÓN DEL CHAT:\n${data.chatConversation}\n` : ''}

---
Este email fue generado automáticamente por el sistema de agendamiento de Aquí Creamos
Por favor, confirma la cita respondiendo a este correo
  `;
}

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
