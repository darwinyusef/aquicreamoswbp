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
    "Arquitectura de Software Escalable & Robusta",
    "Apps con integraciones hechas a la medida + IA",
  ],
  "arquitectura": [
    "Arquitectura de Software Escalable & Robusta",
    "DevOps & Infraestructura Cloud",
    "Desarrollo Full-Stack",
  ],
  "cloud": [
    "DevOps & Infraestructura Cloud",
    "Arquitectura de Software Escalable & Robusta",
  ],
  "devops": [
    "DevOps & Infraestructura Cloud",
    "Arquitectura de Software Escalable & Robusta",
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
  "fullstack": [
    "Desarrollo Full-Stack",
    "Arquitectura de Software Escalable & Robusta",
    "Apps con integraciones hechas a la medida + IA",
  ],
  "móvil": [
    "Aplicaciones Nativas & Cross-Platform",
    "Desarrollo Full-Stack",
    "Apps con integraciones hechas a la medida + IA",
  ],
  "app": [
    "Apps con integraciones hechas a la medida + IA",
    "Aplicaciones Nativas & Cross-Platform",
    "Desarrollo Full-Stack",
  ],
};

// Mapa de categorías → categorías complementarias (cross-selling estratégico)
const CATEGORY_COMPLEMENTS: Record<string, string[]> = {
  "Arquitectura de Software Escalable & Robusta": [
    "DevOps & Infraestructura Cloud",
    "Apps con integraciones hechas a la medida + IA",
    "Desarrollo Full-Stack",
  ],
  "DevOps & Infraestructura Cloud": [
    "Arquitectura de Software Escalable & Robusta",
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
    "Arquitectura de Software Escalable & Robusta",
  ],
};

// Servicios más populares y estratégicos (en orden de prioridad)
const POPULAR_SERVICES = [
  "Agentes de inteligencia artificial y MCP's",
  "Arquitectura de Software Escalable & Robusta",
  "Apps con integraciones hechas a la medida + IA",
  "DevOps & Infraestructura Cloud",
  "Desarrollo Full-Stack",
  "Visión por Computadora hecha a la medida. + IA",
];

// Mapeo de categorías a slugs de servicios
const CATEGORY_TO_SLUG: Record<string, string> = {
  "Agentes de inteligencia artificial y MCP's": "agentes-ia",
  "Apps con integraciones hechas a la medida + IA": "aplicaciones-ia",
  "Desarrollo Full-Stack": "desarrollo-fullstack",
  "Aplicaciones Nativas & Cross-Platform": "apps-moviles",
  "Visión por Computadora hecha a la medida. + IA": "computer-vision",
  "Arquitectura de Software Escalable & Robusta": "arquitectura",
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
  "Arquitectura de Software Escalable & Robusta": "/img/personaje6/01.png",
  "Aprendizaje Automático y por refuerzo + Modelos de IA": "/img/personaje8/01.png",
  "DevOps & Infraestructura Cloud": "/img/personaje6/01.png",
};

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

  // Función helper para agregar servicios únicos
  const addService = (service: Service) => {
    if (
      !addedIds.has(service.id) &&
      service.id !== currentServiceId &&
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
          const servicesInCategory = allServices.filter(
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
    const matchingServices = allServices.filter(
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
      const servicesInCategory = allServices.filter(
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

      const servicesInCategory = allServices.filter(
        (s) => s.category === popularCategory
      );
      if (servicesInCategory.length > 0) {
        addService(servicesInCategory[0]);
      }
    });
  }

  // 4. Si aún no tenemos suficientes, agregar servicios aleatorios
  if (recommendations.length < limit) {
    const remainingServices = allServices.filter(
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

  // Tomar el primer servicio de cada categoría popular
  POPULAR_SERVICES.forEach((popularCategory) => {
    if (!addedCategories.has(popularCategory)) {
      const servicesInCategory = allServices.filter(
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

  // Priorizar según el orden de POPULAR_SERVICES
  POPULAR_SERVICES.forEach((popularCategory) => {
    if (!categoryMap.has(popularCategory)) {
      const serviceInCategory = allServices.find(
        (s) => s.category === popularCategory
      );
      if (serviceInCategory) {
        categoryMap.set(popularCategory, serviceInCategory);
      }
    }
  });

  // Agregar las categorías restantes
  allServices.forEach((service) => {
    if (!categoryMap.has(service.category)) {
      categoryMap.set(service.category, service);
    }
  });

  return Array.from(categoryMap.values());
}

/**
 * Enriquece un servicio con información adicional (slug, imagen)
 */
export function enrichService(service: Service): Service & { slug: string; image: string } {
  return {
    ...service,
    slug: CATEGORY_TO_SLUG[service.category] || "desarrollo-web",
    image: CATEGORY_TO_IMAGE[service.category] || "/img/personaje4/01.png",
  };
}

/**
 * Enriquece un array de servicios
 */
export function enrichServices(services: Service[]): Array<Service & { slug: string; image: string }> {
  return services.map(enrichService);
}
