// Motor de Recomendaciones Inteligente
// Estrategia de marketing para cross-selling y up-selling basada en contexto

interface Service {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  slug?: string;
}

interface RecommendationContext {
  search?: string;
  category?: string;
  currentServiceId?: number;
  limit?: number;
}

// Mapa de palabras clave de búsqueda → categorías relacionadas (estrategia de marketing)
const SEARCH_TO_CATEGORIES: Record<string, string[]> = {
  // Arquitectura & Infraestructura
  "microservicios": [
    "DevOps & Infraestructura Cloud",
    "Oficina de Arquitectura de Software + IA",
    "Apps con integraciones hechas a la medida + IA",
  ],
  "arquitectura": [
    "Oficina de Arquitectura de Software + IA",
    "DevOps & Infraestructura Cloud",
    "Desarrollo Full-Stack",
  ],
  "cloud": [
    "DevOps & Infraestructura Cloud",
    "Oficina de Arquitectura de Software + IA",
  ],
  "devops": [
    "DevOps & Infraestructura Cloud",
    "Oficina de Arquitectura de Software + IA",
    "Apps con integraciones hechas a la medida + IA",
  ],

  // IA & Machine Learning
  "visión": [
    "Visión por Computadora hecha a la medida. + IA",
    "Aprendizaje Automático y por refuerzo + Modelos de IA",
    "Agentes de inteligencia artificial y MCP's",
  ],
  "computer vision": [
    "Visión por Computadora hecha a la medida. + IA",
    "Aprendizaje Automático y por refuerzo + Modelos de IA",
  ],
  "ia": [
    "Agentes de inteligencia artificial y MCP's",
    "Aprendizaje Automático y por refuerzo + Modelos de IA",
    "Apps con integraciones hechas a la medida + IA",
  ],
  "inteligencia artificial": [
    "Agentes de inteligencia artificial y MCP's",
    "Aprendizaje Automático y por refuerzo + Modelos de IA",
    "Visión por Computadora hecha a la medida. + IA",
  ],
  "agentes": [
    "Agentes de inteligencia artificial y MCP's",
    "Aprendizaje Automático y por refuerzo + Modelos de IA",
    "Apps con integraciones hechas a la medida + IA",
  ],
  "machine learning": [
    "Aprendizaje Automático y por refuerzo + Modelos de IA",
    "Agentes de inteligencia artificial y MCP's",
    "DevOps & Infraestructura Cloud",
  ],

  // Desarrollo
  "web": [
    "Desarrollo Full-Stack",
    "Apps con integraciones hechas a la medida + IA",
    "DevOps & Infraestructura Cloud",
  ],
  "desarrollo": [
    "Desarrollo Full-Stack",
    "Oficina de Arquitectura de Software + IA",
    "Apps con integraciones hechas a la medida + IA",
  ],
  "aplicaciones": [
    "Aplicaciones Nativas & Cross-Platform",
    "Apps con integraciones hechas a la medida + IA",
    "Desarrollo Full-Stack",
  ],
  "integraciones": [
    "Apps con integraciones hechas a la medida + IA",
    "Agentes de inteligencia artificial y MCP's",
    "Desarrollo Full-Stack",
  ],
};

// Mapa de categorías → categorías complementarias (cross-selling estratégico)
const CATEGORY_COMPLEMENTS: Record<string, string[]> = {
  "Oficina de Arquitectura de Software + IA": [
    "DevOps & Infraestructura Cloud",
    "Apps con integraciones hechas a la medida + IA",
    "Desarrollo Full-Stack",
  ],
  "DevOps & Infraestructura Cloud": [
    "Oficina de Arquitectura de Software + IA",
    "Apps con integraciones hechas a la medida + IA",
  ],
  "Desarrollo Full-Stack": [
    "Apps con integraciones hechas a la medida + IA",
    "DevOps & Infraestructura Cloud",
    "Aplicaciones Nativas & Cross-Platform",
  ],
  "Aplicaciones Nativas & Cross-Platform": [
    "Desarrollo Full-Stack",
    "Apps con integraciones hechas a la medida + IA",
    "DevOps & Infraestructura Cloud",
  ],
  "Visión por Computadora hecha a la medida. + IA": [
    "Aprendizaje Automático y por refuerzo + Modelos de IA",
    "Agentes de inteligencia artificial y MCP's",
    "Apps con integraciones hechas a la medida + IA",
  ],
  "Aprendizaje Automático y por refuerzo + Modelos de IA": [
    "Agentes de inteligencia artificial y MCP's",
    "Visión por Computadora hecha a la medida. + IA",
    "DevOps & Infraestructura Cloud",
  ],
  "Agentes de inteligencia artificial y MCP's": [
    "Aprendizaje Automático y por refuerzo + Modelos de IA",
    "Apps con integraciones hechas a la medida + IA",
    "Visión por Computadora hecha a la medida. + IA",
  ],
  "Apps con integraciones hechas a la medida + IA": [
    "Agentes de inteligencia artificial y MCP's",
    "Desarrollo Full-Stack",
    "Oficina de Arquitectura de Software + IA",
  ],
};

// Servicios más populares y estratégicos (basado en análisis de services.json)
// Ordenados por: 1. Volumen de servicios, 2. Potencial de cross-selling, 3. Valor estratégico
const POPULAR_SERVICES = [
  "Oficina de Arquitectura de Software + IA",      // 27.87% - MÁS POPULAR
  "Apps con integraciones hechas a la medida + IA",     // 19.67% - ALTO CROSS-SELL
  "Aprendizaje Automático y por refuerzo + Modelos de IA", // 15.57% - TENDENCIA
  "Agentes de inteligencia artificial y MCP's",        // 14.75% - INNOVACIÓN
  "Desarrollo Full-Stack",                             // 9.84% - FUNDACIONAL
  "DevOps & Infraestructura Cloud",                    // 5.74% - COMPLEMENTARIO
  "Aplicaciones Nativas & Cross-Platform",             // 4.92% - ESPECIALIZADO
  "Visión por Computadora hecha a la medida. + IA",   // 1.64% - NICHO
];

// Mapeo de categorías a slugs de servicios
const CATEGORY_TO_SLUG: Record<string, string> = {
  "Agentes de inteligencia artificial y MCP's": "agentes-ia",
  "Apps con integraciones hechas a la medida + IA": "aplicaciones-ia",
  "Desarrollo Full-Stack": "desarrollo-fullstack",
  "Aplicaciones Nativas & Cross-Platform": "apps-moviles",
  "Visión por Computadora hecha a la medida. + IA": "computer-vision",
  "Oficina de Arquitectura de Software + IA": "arquitectura",
  "Aprendizaje Automático y por refuerzo + Modelos de IA": "ia-machine-learning",
  "DevOps & Infraestructura Cloud": "devops-infraestructura",
};

// Imágenes para cada categoría
const CATEGORY_TO_IMAGE: Record<string, string> = {
  "Agentes de inteligencia artificial y MCP's": "/img/personaje1/01.png",
  "Apps con integraciones hechas a la medida + IA": "/img/personaje3/01.png",
  "Desarrollo Full-Stack": "/img/personaje4/01.png",
  "Aplicaciones Nativas & Cross-Platform": "/img/personaje5/01.png",
  "Visión por Computadora hecha a la medida. + IA": "/img/personaje7/01.png",
  "Oficina de Arquitectura de Software + IA": "/img/personaje6/01.png",
  "Aprendizaje Automático y por refuerzo + Modelos de IA": "/img/personaje8/01.png",
  "DevOps & Infraestructura Cloud": "/img/personaje6/01.png",
};

// Servicios que NO deben recomendarse (muy específicos o fuera del core business)
const EXCLUDED_SERVICES = [
  "Integración IoT con ESP32",
  // Agregar otros servicios muy específicos si es necesario
];

/**
 * Genera recomendaciones inteligentes basadas en el contexto
 * @param allServices - Todos los servicios disponibles
 * @param context - Contexto de la búsqueda (search, category, currentServiceId)
 * @returns Array de servicios recomendados
 */
export function getRecommendations(
  allServices: Service[],
  context: RecommendationContext = {}
): Service[] {
  const {
    search = "",
    category = "",
    currentServiceId,
    limit = 6,
  } = context;

  const recommendations: Service[] = [];
  const addedIds = new Set<number>();

  // Filtrar servicios excluidos
  const filteredServices = allServices.filter(
    s => !EXCLUDED_SERVICES.includes(s.name)
  );

  // Función helper para agregar servicios únicos
  const addService = (service: Service) => {
    if (
      !addedIds.has(service.id) &&
      service.id !== currentServiceId &&
      !EXCLUDED_SERVICES.includes(service.name) &&
      recommendations.length < limit
    ) {
      recommendations.push(service);
      addedIds.add(service.id);
    }
  };

  // 1. Si hay búsqueda, priorizar servicios de categorías relacionadas
  if (search) {
    const searchLower = search.toLowerCase();

    // Buscar en el mapa de keywords
    for (const [keyword, categories] of Object.entries(SEARCH_TO_CATEGORIES)) {
      if (searchLower.includes(keyword)) {
        // Agregar servicios de categorías relacionadas
        categories.forEach((relatedCategory) => {
          const servicesInCategory = filteredServices.filter(
            (s) => s.category === relatedCategory
          );
          // Tomar el primer servicio de cada categoría relacionada
          if (servicesInCategory.length > 0) {
            addService(servicesInCategory[0]);
          }
        });
      }
    }

    // También buscar en el nombre y descripción del servicio
    const matchingServices = filteredServices.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower)
    );
    matchingServices.forEach(addService);
  }

  // 2. Si hay categoría, agregar servicios complementarios
  if (category && CATEGORY_COMPLEMENTS[category]) {
    const complementCategories = CATEGORY_COMPLEMENTS[category];

    complementCategories.forEach((complementCategory) => {
      const servicesInCategory = filteredServices.filter(
        (s) => s.category === complementCategory
      );
      // Tomar el primer servicio de cada categoría complementaria
      if (servicesInCategory.length > 0) {
        addService(servicesInCategory[0]);
      }
    });
  }

  // 3. Completar con servicios populares si aún no tenemos suficientes
  if (recommendations.length < limit) {
    POPULAR_SERVICES.forEach((popularCategory) => {
      if (recommendations.length >= limit) return;

      const servicesInCategory = filteredServices.filter(
        (s) => s.category === popularCategory
      );
      if (servicesInCategory.length > 0) {
        addService(servicesInCategory[0]);
      }
    });
  }

  // 4. Si aún no tenemos suficientes, agregar servicios aleatorios
  if (recommendations.length < limit) {
    const remainingServices = filteredServices.filter(
      (s) => !addedIds.has(s.id) && s.id !== currentServiceId
    );

    // Shuffle y tomar los primeros
    const shuffled = remainingServices.sort(() => Math.random() - 0.5);
    shuffled.slice(0, limit - recommendations.length).forEach(addService);
  }

  return recommendations;
}

/**
 * Obtiene recomendaciones para mostrar en el home (servicios populares)
 */
export function getHomeRecommendations(allServices: Service[]): Service[] {
  const recommendations: Service[] = [];
  const addedCategories = new Set<string>();

  // Filtrar servicios excluidos
  const filteredServices = allServices.filter(
    s => !EXCLUDED_SERVICES.includes(s.name)
  );

  // Tomar el primer servicio de cada categoría popular (que no esté excluido)
  POPULAR_SERVICES.forEach((popularCategory) => {
    if (!addedCategories.has(popularCategory)) {
      const servicesInCategory = filteredServices.filter(
        (s) => s.category === popularCategory
      );
      if (servicesInCategory.length > 0) {
        recommendations.push(servicesInCategory[0]);
        addedCategories.add(popularCategory);
      }
    }
  });

  return recommendations;
}

/**
 * Agrupa servicios por categoría y devuelve un representante por categoría
 */
export function getServicesByCategory(allServices: Service[]): Service[] {
  const categoryMap = new Map<string, Service>();

  // Filtrar servicios excluidos
  const filteredServices = allServices.filter(
    s => !EXCLUDED_SERVICES.includes(s.name)
  );

  // Priorizar según el orden de POPULAR_SERVICES
  POPULAR_SERVICES.forEach((popularCategory) => {
    if (!categoryMap.has(popularCategory)) {
      const serviceInCategory = filteredServices.find(
        (s) => s.category === popularCategory
      );
      if (serviceInCategory) {
        categoryMap.set(popularCategory, serviceInCategory);
      }
    }
  });

  // Agregar las categorías restantes
  filteredServices.forEach((service) => {
    if (!categoryMap.has(service.category)) {
      categoryMap.set(service.category, service);
    }
  });

  return Array.from(categoryMap.values());
}

/**
 * Genera keyword de búsqueda estratégica basada en el servicio
 */
function getSearchKeyword(service: Service): string {
  const categoryKeywords: Record<string, string> = {
    "Oficina de Arquitectura de Software + IA": "arquitectura",
    "DevOps & Infraestructura Cloud": "devops",
    "Desarrollo Full-Stack": "desarrollo",  // Cambiado: más genérico y presente en nombres
    "Aplicaciones Nativas & Cross-Platform": "aplicaciones",  // Cambiado: más genérico
    "Visión por Computadora hecha a la medida. + IA": "visión",
    "Aprendizaje Automático y por refuerzo + Modelos de IA": "ia",  // Cambiado: más efectivo
    "Agentes de inteligencia artificial y MCP's": "agentes",
    "Apps con integraciones hechas a la medida + IA": "integraciones",  // Cambiado: más específico
  };

  // Intentar extraer keyword del nombre del servicio o usar la categoría
  const serviceName = service.name.toLowerCase();

  if (serviceName.includes('microservicio')) return 'microservicios';
  if (serviceName.includes('arquitectura')) return 'arquitectura';
  if (serviceName.includes('visión') || serviceName.includes('vision')) return 'visión';
  if (serviceName.includes('agente')) return 'agentes';
  if (serviceName.includes('mlops') || serviceName.includes('modelo')) return 'ia';
  if (serviceName.includes('devops')) return 'devops';
  if (serviceName.includes('cloud')) return 'cloud';
  if (serviceName.includes('web')) return 'web';
  if (serviceName.includes('móvil') || serviceName.includes('movil') || serviceName.includes('app')) return 'aplicaciones';
  if (serviceName.includes('desarrollo')) return 'desarrollo';

  return categoryKeywords[service.category] || service.category.split(' ')[0].toLowerCase();
}

/**
 * Enriquece un servicio con información adicional para el carousel
 * IMPORTANTE: SIEMPRE genera URLs a /aquicreamos con parámetros search y categories
 * NUNCA usa /servicios/slug
 */
export function enrichService(service: Service): Service & { searchUrl: string } {
  const searchKeyword = getSearchKeyword(service);
  const category = encodeURIComponent(service.category);
  const search = encodeURIComponent(searchKeyword);

  return {
    ...service,
    searchUrl: `/aquicreamos?search=${search}&categories=${category}`,
  };
}

/**
 * Enriquece un array de servicios
 */
export function enrichServices(services: Service[]): Array<Service & { searchUrl: string }> {
  return services.map(enrichService);
}
