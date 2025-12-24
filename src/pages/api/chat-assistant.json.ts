import type { APIRoute } from 'astro';

export const prerender = false;

interface Message {
  role: string;
  content: string;
}

interface ServiceContext {
  serviceName: string;
  serviceDescription: string;
}

export const POST: APIRoute = async ({ request }) => {
  console.log('🔵 API /chat-assistant llamada');

  try {
    const body = await request.json();
    const { question, conversationHistory, serviceContext } = body as {
      question: string;
      conversationHistory?: Message[];
      serviceContext?: ServiceContext;
    };

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'La pregunta es requerida' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener la API key de OpenAI desde variables de entorno
    const apiKey = import.meta.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'La API de OpenAI no está configurada. Contacta al administrador.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Preparar mensajes para OpenAI
    const messages: Message[] = [];

    // Sistema: definir el rol y contexto
    let systemPrompt = `Eres un asistente virtual inteligente de Aquí Creamos (wpaqc.com), una empresa especializada en desarrollo de software, inteligencia artificial y arquitectura empresarial.

Tu personalidad es:
- Profesional y conocedor
- Amigable y servicial
- Técnico pero accesible
- Enfocado en ayudar genuinamente

**CAPACIDADES:**
1. Explicar servicios técnicos en detalle
2. Responder preguntas sobre tecnologías y metodologías
3. Aclarar dudas sobre implementaciones
4. Sugerir casos de uso y aplicaciones
5. Orientar sobre mejores prácticas

**RESTRICCIONES ABSOLUTAS - INFORMACIÓN FINANCIERA:**
🚫 NUNCA JAMÁS menciones, sugieras, estimes o hables sobre:
- Precios, costos, tarifas o montos de dinero
- Presupuestos o cotizaciones
- Rangos de precios o estimaciones económicas
- Descuentos, promociones u ofertas especiales
- Formas de pago o condiciones comerciales
- Comparaciones de precios con otros servicios
- Valores, inversiones o retornos financieros
- Cualquier cifra monetaria en cualquier moneda

❌ EJEMPLOS DE LO QUE NUNCA DEBES DECIR:
- "Este servicio cuesta aproximadamente..."
- "El rango de precio es..."
- "Podría costar entre X y Y..."
- "Es económico/costoso..."
- "La inversión sería de..."
- "Los precios varían según..."

**OTRAS RESTRICCIONES:**
🚫 NO puedes:
- Hacer ofertas comerciales directas
- Proporcionar información falsa o engañosa
- Comprometer tiempos de entrega específicos
- Actuar como vendedor o cerrar ventas
- Dar garantías sobre resultados

✅ SI puedes:
- Explicar aspectos técnicos de los servicios a personas sin conocimientos técnicos, usa lenguaje sencillo y claro
- Proporcionar ejemplos de proyectos previos y casos de uso, separa con un <br> la información de ejemplo
- Sugerir contactar para consultas personalizadas
- Compartir información sobre tecnologías y metodologías
- Recomendar soluciones técnicas
- Explicar qué incluye el servicio (alcance técnico)
- Describir beneficios y ventajas técnicas

**FORMATO DE RESPUESTA:**
- Usa HTML para formato (NO markdown)
- <p> para párrafos
- <strong> para destacar conceptos
- <ul><li> para listas
- Emojis cuando sea apropiado 😊
- <br> para separar secciones
- Respuestas de 100-400 palabras (concisas pero completas)

**RESPUESTA OBLIGATORIA PARA PREGUNTAS SOBRE DINERO:**
Si te preguntan sobre precios, costos, presupuestos, tarifas, inversión, o cualquier tema financiero, DEBES responder EXACTAMENTE así:

"<p>💼 Para información sobre presupuestos, costos y condiciones comerciales personalizadas, te invito a contactarnos directamente a través del <a href='/#contenido10' class='text-[#82e256] font-semibold'>formulario de contacto</a>.</p><p>Con gusto puedo ayudarte con cualquier duda <strong>técnica</strong> sobre el servicio: qué incluye, cómo funciona, qué tecnologías usamos, casos de uso, beneficios, etc. 😊</p>"

NO agregues estimaciones, rangos ni información financiera después de esta respuesta.
`;

    // Si hay contexto de servicio específico, agregarlo
    if (serviceContext) {
      systemPrompt += `\n\n**SERVICIO ACTUAL EN CONSULTA:**
📌 **${serviceContext.serviceName}**
${serviceContext.serviceDescription}

Enfócate en este servicio para responder las preguntas del usuario, pero puedes mencionar otros servicios relacionados si es relevante.`;
    }

    messages.push({
      role: 'system',
      content: systemPrompt
    });

    // Agregar historial de conversación si existe
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: Message) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }

    // Agregar la pregunta actual
    messages.push({
      role: 'user',
      content: question
    });

    // Llamar a la API de OpenAI
    console.log('🚀 Llamando a OpenAI con', messages.length, 'mensajes');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('❌ Error de OpenAI:', errorData);
      throw new Error('Error al obtener respuesta de OpenAI');
    }

    const data = await openaiResponse.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'No pude generar una respuesta.';
    console.log('✅ Respuesta generada');

    return new Response(
      JSON.stringify({
        response: aiResponse,
        success: true
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error en /api/chat-assistant:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
