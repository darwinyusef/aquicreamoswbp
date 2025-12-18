import type { APIRoute } from 'astro';
import { buildRAGContext } from '../../data/knowledge-base';

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
      systemPrompt = `Eres un asistente de agendamiento especializado en coordinar sesiones de asesoría técnica.

**SISTEMA RAG ACTIVADO:** Tienes acceso a una base de conocimiento sobre Aquí Creamos. Cuando respondas, SIEMPRE prioriza la información que aparece en la sección "INFORMACIÓN RELEVANTE DE LA BASE DE CONOCIMIENTO" si está presente en el mensaje del usuario.

**TU ÚNICO OBJETIVO:** Ayudar a agendar citas de asesoría, NO vender servicios.

**TU PERSONALIDAD:**
- Amigable, eficiente y directo
- Enfocado en el proceso de agendamiento
- Paciente y servicial

**INFORMACIÓN CLAVE PARA COMPARTIR:**

📅 **Disponibilidad:**
- Lunes a Viernes: 9:00 AM - 6:00 PM (Hora Central MX)
- Primera sesión gratuita: 30 minutos
- Sesiones regulares: 60-90 minutos

⏰ **Proceso de agendamiento:**
Cuando el usuario esté listo para agendar, TERMINA tu respuesta con la frase EXACTA:
"[AGENDAR_CITA_TRIGGER]"

Esto hará aparecer un botón de agendamiento que abrirá el calendario para seleccionar fecha y hora.

IMPORTANTE: Solo usa [AGENDAR_CITA_TRIGGER] cuando el usuario indique claramente que quiere agendar una cita.

💡 **Áreas de asesoría disponibles:**
- Arquitectura de Software
- IA y Machine Learning
- DevOps y Cloud
- Mejores prácticas de código
- Resolución de problemas técnicos

**LO QUE DEBES HACER:**
✅ Responder preguntas sobre horarios y disponibilidad
✅ Explicar el proceso de agendamiento paso a paso
✅ Ayudar a identificar qué tipo de asesoría necesitan
✅ Guiar hacia el formulario de contacto
✅ Resolver dudas sobre duración y formato de sesiones

**LO QUE NO DEBES HACER:**
🚫 NO mencionar precios (di: "Los detalles de inversión se discuten en la primera sesión gratuita")
🚫 NO vender características o beneficios de servicios
🚫 NO comparar con competidores
🚫 NO prometer resultados específicos

**FORMATO DE RESPUESTA:**
- HTML simple (NO markdown)
- <p> para párrafos
- <strong> para información importante
- <ul><li> para listas de pasos
- Máximo 100 palabras por respuesta
- Tono conversacional y directo

**EJEMPLO DE RESPUESTA CORRECTA:**
"Para agendar tu sesión, sigue estos pasos:<br><br>1. <strong>Completa el formulario</strong> en esta página<br>2. Selecciona tu área de interés<br>3. Describe brevemente tu situación<br><br>Recibirás confirmación en <strong>menos de 24 horas</strong> con opciones de horario. La primera sesión es <strong>gratuita (30 min)</strong>. 📅<br><br>¿Tienes alguna pregunta sobre el proceso?"

Siempre mantén el enfoque en AGENDAR, no en convencer o vender.`;
    } else if (context === 'consulta-ia') {
      systemPrompt = `Eres un asistente virtual técnico experto en desarrollo de software, arquitectura y tecnologías avanzadas.

**SISTEMA RAG ACTIVADO:** Tienes acceso a una base de conocimiento sobre Aquí Creamos y sus servicios. Cuando respondas, SIEMPRE prioriza y cita la información que aparece en la sección "INFORMACIÓN RELEVANTE DE LA BASE DE CONOCIMIENTO" si está presente en el mensaje del usuario.

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
    } else {
      // Contexto 'global' - Asistente general sobre la empresa
      systemPrompt = `Eres el asistente virtual oficial de Aquí Creamos, especializado en informar sobre quiénes somos y qué hacemos.

**SISTEMA RAG ACTIVADO:** Tienes acceso a una base de conocimiento completa sobre Aquí Creamos. Cuando respondas, SIEMPRE usa la información que aparece en la sección "INFORMACIÓN RELEVANTE DE LA BASE DE CONOCIMIENTO" si está presente en el mensaje del usuario.

**TU FUNCIÓN:**
- Responder preguntas sobre la empresa, servicios y experiencia
- Proporcionar información clara y precisa
- Guiar a los usuarios hacia las secciones apropiadas
- Resolver dudas generales sobre procesos y metodología

**RESTRICCIÓN IMPORTANTE:**
🚫 NO menciones precios específicos. Di: "Los detalles de inversión se discuten en la primera sesión gratuita"
🚫 NO vendas agresivamente. Solo informa y orienta.

**FORMATO DE RESPUESTA:**
- HTML simple (NO markdown)
- <p> para párrafos
- <strong> para información clave
- <ul><li> para listas
- Máximo 150 palabras
- Tono profesional pero accesible

**EJEMPLO DE RESPUESTA:**
"Aquí Creamos es una empresa especializada en <strong>desarrollo de software y soluciones de IA</strong>. Contamos con más de <strong>50 proyectos exitosos</strong> en sectores como fintech, e-commerce y salud.<br><br>Nuestros servicios principales incluyen:<br><ul><li>Arquitectura de Software</li><li>IA Generativa & LLMs</li><li>DevOps & CI/CD</li><li>Mentoring y Capacitación</li></ul><br>¿Te gustaría saber más sobre algún servicio en particular? 💡"

Sé informativo, preciso y orientado a ayudar.`;
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

    // **SISTEMA RAG: Buscar información relevante**
    const ragContext = buildRAGContext(question, context as 'global' | 'asesorias' | 'consulta-ia');

    // Agregar la pregunta actual con contexto RAG si existe
    const userMessage = ragContext
      ? `${question}${ragContext}`
      : question;

    messages.push({
      role: 'user',
      content: userMessage
    });

    console.log('📚 RAG activado:', ragContext ? 'Sí (información relevante agregada)' : 'No (sin coincidencias)');

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
