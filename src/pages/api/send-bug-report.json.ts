import type { APIRoute } from 'astro';

export const prerender = false;

const BACKEND_URL = import.meta.env.BACKEND_URL || 'http://localhost:3001';

interface BugReportData {
  type: string;
  page: string;
  title: string;
  description: string;
  email: string;
  timestamp: string;
  userAgent: string;
  screenSize: string;
  url: string;
}

export const POST: APIRoute = async ({ request }) => {
  console.log('🐛 API /send-bug-report llamada');

  try {
    const body = await request.json();
    const bugData: BugReportData = body;

    // Validaciones
    if (!bugData.title || !bugData.description) {
      return new Response(
        JSON.stringify({
          error: 'Faltan datos requeridos (título y descripción)',
          success: false
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Preparar el contenido del email
    const emailContent = {
      subject: `🐛 Bug Report: ${bugData.title}`,
      bugReport: {
        type: bugData.type || 'not-specified',
        page: bugData.page,
        title: bugData.title,
        description: bugData.description,
        email: bugData.email,
        timestamp: bugData.timestamp,
        userAgent: bugData.userAgent,
        screenSize: bugData.screenSize,
        url: bugData.url
      }
    };

    console.log('📧 Enviando reporte de bug al backend:', emailContent);

    // Enviar al backend
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/bug-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailContent),
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        console.log('✅ Reporte de bug enviado exitosamente:', backendData);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Reporte de bug enviado exitosamente. Gracias por tu ayuda.',
            data: backendData
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } else {
        const errorData = await backendResponse.json();
        console.error('⚠️ Error en backend:', errorData);

        return new Response(
          JSON.stringify({
            error: 'Error al enviar el reporte al backend',
            success: false,
            details: errorData
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (backendError) {
      console.error('❌ Error al comunicarse con el backend:', backendError);

      // Guardar en localStorage como fallback (ya se hace en el frontend)
      // pero retornar error para que el usuario sepa
      return new Response(
        JSON.stringify({
          error: 'No se pudo conectar con el servidor. Por favor, intenta más tarde.',
          success: false
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Error en /api/send-bug-report:', error);
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
