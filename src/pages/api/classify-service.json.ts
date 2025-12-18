import type { APIRoute } from 'astro';
import { classifyService, type QuestionnaireData } from '../../lib/service-classifier';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  console.log('🤖 API /classify-service llamada');

  try {
    const body = await request.json();
    const questionnaireData: QuestionnaireData = body;

    // Validar que tengamos los campos requeridos
    if (!questionnaireData.project_type || !questionnaireData.project_stage) {
      return new Response(
        JSON.stringify({
          error: 'Faltan campos requeridos del cuestionario',
          success: false
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📊 Datos recibidos:', {
      project_type: questionnaireData.project_type,
      stage: questionnaireData.project_stage,
      budget: questionnaireData.budget,
      features: questionnaireData.features?.length || 0
    });

    // Clasificar con TensorFlow.js
    const classification = await classifyService(questionnaireData);

    console.log('✅ Clasificación completada:', classification.service);

    return new Response(
      JSON.stringify({
        success: true,
        classification: classification
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error en /api/classify-service:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error al clasificar servicio',
        success: false
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
