/**
 * Base de Conocimiento para el Sistema RAG
 *
 * Este archivo contiene toda la información estructurada sobre Aquí Creamos
 * que será utilizada por los 3 tipos de asistentes de IA.
 */

export interface KnowledgeItem {
  id: string;
  category: string;
  topic: string;
  content: string;
  tags: string[];
  contexts: ('global' | 'asesorias' | 'consulta-ia')[];
}

export const knowledgeBase: KnowledgeItem[] = [

  // ===== INFORMACIÓN GENERAL DE LA EMPRESA =====
  {
    id: 'empresa-001',
    category: 'Empresa',
    topic: '¿Quiénes somos?',
    content: `Aquí Creamos es una empresa especializada en desarrollo de software y soluciones de inteligencia artificial.
    Nos enfocamos en arquitectura de software avanzada, IA generativa, DevOps y transformación digital.
    Contamos con más de 50 proyectos exitosos en sectores como fintech, e-commerce, salud y educación.`,
    tags: ['empresa', 'sobre nosotros', 'identidad'],
    contexts: ['global', 'asesorias', 'consulta-ia']
  },

  {
    id: 'empresa-002',
    category: 'Empresa',
    topic: 'Nuestra experiencia',
    content: `Tenemos experiencia comprobada con:
    - Más de 50 proyectos de alta complejidad entregados
    - Reducción promedio del 40% en costos operativos
    - Reducción promedio del 60% en tiempos de desarrollo
    - Clientes en múltiples países de Latinoamérica
    - Equipo certificado en tecnologías cloud, IA y arquitectura`,
    tags: ['experiencia', 'resultados', 'métricas'],
    contexts: ['global', 'asesorias']
  },

  {
    id: 'empresa-003',
    category: 'Empresa',
    topic: 'Stack tecnológico',
    content: `Trabajamos con tecnologías modernas y demandadas:
    - Cloud: AWS, Azure, Google Cloud
    - Contenedores: Docker, Kubernetes
    - Backend: Node.js, Python, Java, Go
    - Frontend: React, Vue, Astro, Next.js
    - Bases de datos: PostgreSQL, MongoDB, Redis
    - IA: OpenAI GPT-4, Anthropic Claude, LangChain, Vector Databases
    - DevOps: GitHub Actions, GitLab CI/CD, Terraform`,
    tags: ['tecnologías', 'stack', 'herramientas'],
    contexts: ['global', 'consulta-ia']
  },

  // ===== SERVICIOS DE ASESORÍAS =====
  {
    id: 'servicio-001',
    category: 'Servicios',
    topic: 'Arquitectura Hexagonal & Clean',
    content: `Diseñamos sistemas desacoplados y mantenibles que separan la lógica de negocio de las implementaciones técnicas.
    Beneficios:
    - Código fácil de testear (cobertura >80%)
    - Cambios de tecnología sin afectar el negocio
    - Mejor organización para equipos grandes
    - Reducción de deuda técnica
    Ideal para: Proyectos que necesitan escalar, sistemas legacy que requieren refactorización.`,
    tags: ['arquitectura', 'hexagonal', 'clean architecture', 'desacoplamiento'],
    contexts: ['global', 'asesorias', 'consulta-ia']
  },

  {
    id: 'servicio-002',
    category: 'Servicios',
    topic: 'Microservicios & DDD',
    content: `Arquitecturas distribuidas con Domain-Driven Design para aplicaciones complejas.
    Beneficios:
    - Servicios independientes que escalan autónomamente
    - Equipos trabajando en paralelo sin bloqueos
    - Resiliencia: si un servicio falla, otros continúan
    - Deployment independiente por servicio
    Ideal para: Aplicaciones empresariales grandes, sistemas que necesitan alta disponibilidad.`,
    tags: ['microservicios', 'ddd', 'distributed', 'escalabilidad'],
    contexts: ['global', 'asesorias', 'consulta-ia']
  },

  {
    id: 'servicio-003',
    category: 'Servicios',
    topic: 'IA Generativa & LLMs',
    content: `Integración de modelos de lenguaje grandes para automatización inteligente.
    Servicios:
    - Chatbots con GPT-4 o Claude (conversacionales)
    - RAG (Retrieval-Augmented Generation) para sistemas con conocimiento específico
    - Embeddings y búsqueda semántica
    - Asistentes virtuales personalizados
    - Automatización de contenido
    Ideal para: Empresas que quieren automatizar atención al cliente, generar contenido o procesar documentos.`,
    tags: ['ia', 'llm', 'gpt', 'chatbot', 'rag', 'automatización'],
    contexts: ['global', 'asesorias', 'consulta-ia']
  },

  {
    id: 'servicio-004',
    category: 'Servicios',
    topic: 'DevOps & CI/CD',
    content: `Automatización completa del ciclo de desarrollo a producción.
    Servicios:
    - Pipelines de CI/CD con GitHub Actions, GitLab
    - Containerización con Docker
    - Orquestación con Kubernetes
    - Infrastructure as Code (Terraform, Pulumi)
    - Monitoreo y alertas (Prometheus, Grafana)
    Beneficios: Deployments más rápidos, menos errores humanos, rollback automático.
    Ideal para: Equipos que hacen múltiples deploys al día, empresas con alta demanda.`,
    tags: ['devops', 'cicd', 'docker', 'kubernetes', 'automatización'],
    contexts: ['global', 'asesorias', 'consulta-ia']
  },

  {
    id: 'servicio-005',
    category: 'Servicios',
    topic: 'Clean Code & SOLID',
    content: `Refactorización y mejora de código legacy.
    Servicios:
    - Auditoría de código y detección de code smells
    - Refactorización siguiendo principios SOLID
    - Implementación de patrones de diseño
    - Mejora de legibilidad y mantenibilidad
    - Capacitación del equipo en buenas prácticas
    Ideal para: Proyectos con código legacy difícil de mantener, equipos nuevos que necesitan estándares.`,
    tags: ['clean code', 'solid', 'refactoring', 'patrones', 'código limpio'],
    contexts: ['global', 'asesorias', 'consulta-ia']
  },

  {
    id: 'servicio-006',
    category: 'Servicios',
    topic: 'Testing Avanzado TDD/BDD',
    content: `Implementación de estrategias de testing automatizado.
    Servicios:
    - Test-Driven Development (TDD): escribir tests antes del código
    - Behavior-Driven Development (BDD): tests desde perspectiva del usuario
    - Pruebas unitarias, de integración y E2E
    - Configuración de frameworks (Jest, Pytest, Cypress)
    - Cobertura de código >80%
    Beneficios: Menos bugs en producción, refactorización segura, documentación viva.
    Ideal para: Proyectos críticos, equipos que quieren mejorar calidad.`,
    tags: ['testing', 'tdd', 'bdd', 'pruebas', 'calidad'],
    contexts: ['global', 'asesorias', 'consulta-ia']
  },

  // ===== PROCESO DE AGENDAMIENTO =====
  {
    id: 'agenda-001',
    category: 'Agendamiento',
    topic: 'Disponibilidad de horarios',
    content: `Nuestros horarios de atención para asesorías son:
    - Lunes a Viernes: 9:00 AM - 6:00 PM (Hora Central México)
    - Sesiones virtuales por Google Meet o Zoom
    - Primera sesión gratuita: 30 minutos de evaluación
    - Sesiones regulares: 60-90 minutos
    - También ofrecemos sesiones los sábados bajo solicitud especial`,
    tags: ['horarios', 'disponibilidad', 'calendario'],
    contexts: ['asesorias']
  },

  {
    id: 'agenda-002',
    category: 'Agendamiento',
    topic: 'Proceso de agendamiento',
    content: `Pasos para agendar tu sesión de asesoría:
    1. Completa el formulario de contacto en la página
    2. Selecciona tu área de interés (Arquitectura, IA, DevOps, etc.)
    3. Describe brevemente tu situación o proyecto
    4. Recibirás confirmación por email en menos de 24 horas
    5. Te enviaremos 3 opciones de horario disponibles
    6. Confirmas el horario que prefieres
    7. Te enviamos enlace de videollamada 1 hora antes

    Nota: Si es urgente, menciona "urgente" en la descripción.`,
    tags: ['proceso', 'pasos', 'cómo agendar'],
    contexts: ['asesorias']
  },

  {
    id: 'agenda-003',
    category: 'Agendamiento',
    topic: 'Primera sesión gratuita',
    content: `La primera sesión es completamente gratuita y dura 30 minutos.
    En esta sesión:
    - Conocemos tu proyecto o situación actual
    - Identificamos los desafíos principales
    - Te damos recomendaciones iniciales
    - Proponemos un plan de trabajo (si aplica)
    - Discutimos opciones de colaboración

    No hay compromiso: después de la sesión gratuita decides si quieres continuar.
    Los detalles de inversión se discuten al final de esta primera sesión.`,
    tags: ['primera sesión', 'gratis', 'evaluación'],
    contexts: ['asesorias']
  },

  {
    id: 'agenda-004',
    category: 'Agendamiento',
    topic: 'Qué preparar para la sesión',
    content: `Para aprovechar al máximo tu sesión de asesoría, te recomendamos tener:
    - Descripción breve de tu proyecto o problema
    - Tecnologías actuales que usas (si aplica)
    - Objetivos principales que quieres lograr
    - Restricciones conocidas (presupuesto, tiempo, equipo)
    - Acceso a tu código o arquitectura (para sesiones técnicas)

    No te preocupes si no tienes todo: trabajamos con lo que tengas disponible.`,
    tags: ['preparación', 'requisitos', 'qué traer'],
    contexts: ['asesorias']
  },

  // ===== MENTORING Y CURSOS =====
  {
    id: 'formacion-001',
    category: 'Formación',
    topic: 'Mentoring personalizado',
    content: `Ofrecemos mentoring 1:1 o para equipos completos.
    Características:
    - Sesiones personalizadas según tus necesidades
    - Revisión de código en tiempo real
    - Roadmaps de crecimiento profesional
    - Acceso a materiales y recursos exclusivos
    - Seguimiento continuo de progreso

    Ideal para: Desarrolladores que quieren subir de nivel, equipos que necesitan capacitación interna.`,
    tags: ['mentoring', 'capacitación', '1:1', 'formación'],
    contexts: ['global', 'asesorias']
  },

  {
    id: 'formacion-002',
    category: 'Formación',
    topic: 'Cursos especializados',
    content: `Programas intensivos in-company o remotos con certificación.
    Cursos disponibles:
    - Arquitectura de Software Avanzada (40 horas)
    - IA Generativa & LLMs en Producción (30 horas)
    - DevOps & Cloud Native (35 horas)
    - Microservicios con DDD (40 horas)
    - Clean Code & SOLID (20 horas)

    Todos incluyen: Material didáctico, ejercicios prácticos, proyecto final y certificado.
    Modalidad: Presencial o remoto, fines de semana o entre semana.`,
    tags: ['cursos', 'certificación', 'formación', 'training'],
    contexts: ['global', 'asesorias']
  },

  // ===== RESTRICCIONES Y POLÍTICAS =====
  {
    id: 'politica-001',
    category: 'Políticas',
    topic: 'Política de precios',
    content: `IMPORTANTE PARA EL ASISTENTE: NO mencionar precios específicos en el chat.
    Siempre responder: "Los detalles de inversión se discuten en la primera sesión gratuita,
    donde evaluamos tu proyecto y te damos una propuesta personalizada."

    Nota: Tenemos opciones para todos los presupuestos, desde freelancers hasta empresas grandes.`,
    tags: ['precios', 'costos', 'inversión'],
    contexts: ['asesorias', 'consulta-ia']
  },

  {
    id: 'politica-002',
    category: 'Políticas',
    topic: 'Política de cancelación',
    content: `Cancelaciones y reprogramaciones:
    - Puedes cancelar hasta 24 horas antes sin penalización
    - Reprogramar es gratuito (hasta 2 veces)
    - Cancelaciones con menos de 24 horas: se cobra el 50%
    - No-shows (no avisar): se cobra el 100%

    Para cancelar: envía email a contacto@aquicreamos.com`,
    tags: ['cancelación', 'reprogramar', 'políticas'],
    contexts: ['asesorias']
  },

  {
    id: 'politica-003',
    category: 'Políticas',
    topic: 'Confidencialidad y NDA',
    content: `Protegemos tu información:
    - Firmamos NDA (Non-Disclosure Agreement) si lo requieres
    - Todo el código y documentación es confidencial
    - No compartimos información de proyectos con terceros
    - Servidores seguros con encriptación
    - Cumplimiento con GDPR y regulaciones locales`,
    tags: ['confidencialidad', 'nda', 'seguridad', 'privacidad'],
    contexts: ['global', 'asesorias']
  },

  // ===== CASOS DE USO Y EJEMPLOS =====
  {
    id: 'caso-001',
    category: 'Casos de Uso',
    topic: 'Startups y MVPs',
    content: `Para startups y MVPs recomendamos:
    - Arquitectura modular que permita crecer sin reescribir
    - Stack moderno y probado (evitar experimentación excesiva)
    - CI/CD desde el día 1 para iterar rápido
    - Testing automatizado en funcionalidades críticas
    - Cloud escalable (AWS/Azure con auto-scaling)

    Tiempo estimado: 2-4 meses para MVP robusto.`,
    tags: ['startup', 'mvp', 'emprendimiento'],
    contexts: ['global', 'asesorias', 'consulta-ia']
  },

  {
    id: 'caso-002',
    category: 'Casos de Uso',
    topic: 'Modernización de sistemas legacy',
    content: `Para modernizar sistemas legacy:
    - Estrategia de Strangler Pattern (migración incremental)
    - Identificar servicios críticos vs. no críticos
    - Priorizar por impacto de negocio
    - Tests antes de refactorizar (para evitar regresiones)
    - Documentación del sistema actual

    Enfoque recomendado: No Big Bang Rewrite, sino migración gradual.
    Tiempo estimado: 6-18 meses según tamaño del sistema.`,
    tags: ['legacy', 'modernización', 'migración', 'refactorización'],
    contexts: ['global', 'asesorias', 'consulta-ia']
  },

  {
    id: 'caso-003',
    category: 'Casos de Uso',
    topic: 'Integración de IA en negocios existentes',
    content: `Pasos para integrar IA en tu negocio:
    1. Identificar procesos repetitivos o costosos
    2. Evaluar viabilidad técnica y ROI
    3. Elegir el approach correcto (APIs, modelo propio, fine-tuning)
    4. Implementar MVP de IA en ambiente controlado
    5. Medir resultados y ajustar
    6. Escalar a producción

    Casos comunes: Chatbots de soporte, análisis de sentimientos, recomendaciones,
    automatización de emails, extracción de datos de documentos.`,
    tags: ['ia', 'integración', 'automatización', 'chatbot'],
    contexts: ['global', 'asesorias', 'consulta-ia']
  },

  // ===== PREGUNTAS FRECUENTES =====
  {
    id: 'faq-001',
    category: 'FAQ',
    topic: '¿Trabajan con empresas fuera de México?',
    content: `Sí, trabajamos con clientes en toda Latinoamérica y algunos en España/USA.
    - Las sesiones son virtuales (Google Meet/Zoom)
    - Horarios flexibles según zona horaria
    - Pagos internacionales aceptados (PayPal, transferencia, Stripe)
    - Comunicación en español o inglés`,
    tags: ['internacional', 'países', 'remoto'],
    contexts: ['global', 'asesorias']
  },

  {
    id: 'faq-002',
    category: 'FAQ',
    topic: '¿Cuánto tiempo toma un proyecto típico?',
    content: `Depende de la complejidad:
    - MVP básico: 2-3 meses
    - Sistema empresarial mediano: 4-8 meses
    - Plataforma compleja/enterprise: 8-18 meses
    - Refactorización de legacy: 6-12 meses

    En la primera sesión gratuita te damos un estimado más preciso según tu proyecto.`,
    tags: ['tiempo', 'duración', 'plazo'],
    contexts: ['global', 'asesorias']
  },

  {
    id: 'faq-003',
    category: 'FAQ',
    topic: '¿Ofrecen soporte post-lanzamiento?',
    content: `Sí, todos nuestros proyectos incluyen:
    - 30 días de soporte post-implementación incluido
    - Documentación técnica completa
    - Capacitación del equipo
    - Planes de soporte mensual disponibles
    - SLAs personalizados para empresas

    El soporte cubre: bugs, dudas técnicas, ajustes menores.`,
    tags: ['soporte', 'mantenimiento', 'post-lanzamiento'],
    contexts: ['global', 'asesorias']
  }

];

/**
 * Función para buscar conocimiento relevante según la consulta
 */
export function searchKnowledge(
  query: string,
  context: 'global' | 'asesorias' | 'consulta-ia',
  limit: number = 3
): KnowledgeItem[] {
  const queryLower = query.toLowerCase();

  // Filtrar por contexto
  const filteredByContext = knowledgeBase.filter(item =>
    item.contexts.includes(context)
  );

  // Calcular relevancia (score simple por coincidencias)
  const scoredItems = filteredByContext.map(item => {
    let score = 0;

    // Buscar en contenido
    if (item.content.toLowerCase().includes(queryLower)) score += 5;

    // Buscar en topic
    if (item.topic.toLowerCase().includes(queryLower)) score += 10;

    // Buscar en tags
    item.tags.forEach(tag => {
      if (queryLower.includes(tag.toLowerCase())) score += 3;
    });

    return { item, score };
  });

  // Ordenar por relevancia y retornar top N
  return scoredItems
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.item);
}

/**
 * Función para obtener todo el conocimiento de un contexto específico
 */
export function getContextKnowledge(context: 'global' | 'asesorias' | 'consulta-ia'): KnowledgeItem[] {
  return knowledgeBase.filter(item => item.contexts.includes(context));
}

/**
 * Función para construir el contexto RAG que se enviará al LLM
 */
export function buildRAGContext(
  query: string,
  context: 'global' | 'asesorias' | 'consulta-ia'
): string {
  const relevantItems = searchKnowledge(query, context, 5);

  if (relevantItems.length === 0) {
    return '';
  }

  let ragContext = '\n\n**INFORMACIÓN RELEVANTE DE LA BASE DE CONOCIMIENTO:**\n\n';

  relevantItems.forEach((item, index) => {
    ragContext += `${index + 1}. **${item.topic}**\n`;
    ragContext += `${item.content}\n\n`;
  });

  return ragContext;
}
