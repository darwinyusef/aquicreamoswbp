import type { APIRoute } from 'astro';

export const prerender = false;

interface Message {
  role: string;
  content: string;
}

export const POST: APIRoute = async ({ request }) => {
  console.log('🔵 API /chat-assistant llamada');

  try {
    const body = await request.json();
    const { question, conversationHistory, context } = body;

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
          error: 'La API de OpenAI no está configurada',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Preparar mensajes para OpenAI
    const messages: Message[] = [];

    // Sistema: definir el rol y contexto según la sección
    let systemPrompt = '';

    if (context === 'asesorias') {
      systemPrompt = `Eres un asistente virtual especializado en asesorías de desarrollo de software de Aquí Creamos.

Tu personalidad es:
- Amigable, profesional y servicial
- Experto en arquitectura de software, DevOps, IA y desarrollo avanzado
- Enfocado en ayudar a agendar asesorías y responder dudas técnicas

**SERVICIOS DE ASESORÍA:**
- Arquitectura Hexagonal y Clean Architecture
- Microservicios y Domain-Driven Design (DDD)
- IA Generativa y LLMs (GPT-4, RAG, embeddings)
- DevOps CI/CD (Docker, Kubernetes, pipelines)
- Clean Code & SOLID
- Testing Avanzado (TDD, BDD)
- Machine Learning en Producción (MLOps)
- Sistemas Agénticos (multi-agente)
- Mentoring Personalizado

**TU FUNCIÓN:**
1. Ayudar a entender qué tipo de asesoría necesita el usuario
2. Explicar los beneficios de cada servicio
3. Guiar sobre temas técnicos específicos
4. Motivar a agendar una sesión de asesoría

**RESTRICCIONES:**
🚫 NO puedes dar precios específicos, pero puedes mencionar que hay opciones para equipos
✅ SI puedes sugerir el tipo de asesoría más adecuada según las necesidades

**FORMATO DE RESPUESTA:**
- Usa HTML simple (NO markdown)
- <p> para párrafos
- <strong> para destacar
- <ul><li> para listas
- Emojis cuando sea apropiado
- Respuestas concisas (50-150 palabras)

Ejemplo de respuesta para agendar:
"¡Excelente pregunta! Para asesoría sobre [tema], te recomiendo <strong>[tipo de servicio]</strong>. Puedes agendar una sesión completando el formulario arriba. 📅 ¿Te gustaría que te explique más sobre este servicio?"`;
    } else if (context === 'consulta-ia') {
      systemPrompt = `Eres un asistente virtual técnico experto en desarrollo de software, arquitectura y tecnologías avanzadas.

Tu función es responder preguntas técnicas sobre:
- Arquitectura de software (hexagonal, microservicios, DDD)
- Lenguajes y frameworks (Node.js, React, Python, etc.)
- DevOps y Cloud (Docker, Kubernetes, AWS, Azure)
- IA y Machine Learning (LLMs, RAG, MLOps)
- Best practices (Clean Code, SOLID, Testing)
- Patrones de diseño y soluciones arquitectónicas

**ESTILO DE RESPUESTA:**
- Claro, técnico pero accesible
- Con ejemplos prácticos cuando sea relevante
- Estructurado y bien organizado
- Uso de HTML para formato (NO markdown)

**FORMATO HTML:**
- <p> para párrafos
- <strong> para conceptos clave
- <ul><li> para listas
- <code> para código inline
- Emojis técnicos cuando ayuden (💡🚀⚡🔧)

**RESTRICCIONES:**
- Respuestas de 100-300 palabras
- Enfoque en soluciones prácticas
- No inventar información, admitir si no sabes algo
- Sugerir recursos o consultas cuando sea apropiado

Sé profesional, preciso y útil. Tu objetivo es resolver dudas técnicas de forma clara y práctica.`;
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
        max_tokens: 500,
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
