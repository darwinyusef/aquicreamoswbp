# 🎯 Sistema de Recomendaciones Dinámicas - Estilo Netflix

## 📊 Análisis de Datos (services.json)

**Total de servicios:** 122

### Top Categorías por Volumen
1. **Oficina de Arquitectura de Software + IA** - 34 servicios (27.87%)
2. **Apps con integraciones hechas a la medida + IA** - 24 servicios (19.67%)
3. **Aprendizaje Automático y por refuerzo + Modelos de IA** - 19 servicios (15.57%)
4. **Agentes de inteligencia artificial y MCP's** - 18 servicios (14.75%)
5. **Desarrollo Full-Stack** - 12 servicios (9.84%)
6. **DevOps & Infraestructura Cloud** - 7 servicios (5.74%)
7. **Aplicaciones Nativas & Cross-Platform** - 6 servicios (4.92%)
8. **Visión por Computadora hecha a la medida. + IA** - 2 servicios (1.64%)

---

## 🎨 Componentes Creados

### 1. Motor de Recomendaciones (`src/utils/recommendations.ts`)

**Funciones principales:**

#### `getRecommendations(allServices, context)`
Genera recomendaciones inteligentes basadas en contexto:
- Búsqueda de keywords
- Categoría actual
- Servicio actual
- Cross-selling estratégico

```typescript
const recommendations = getRecommendations(allServices, {
  search: "microservicios",
  category: "Oficina de Arquitectura de Software + IA",
  limit: 6
});
```

#### `getHomeRecommendations(allServices)`
Retorna los servicios más populares para el home (basado en volumen y estrategia)

#### `enrichServices(services)`
Enriquece servicios con URLs de búsqueda dinámicas

**Ejemplo de URL generada:**
```
/aquicreamos?search=arquitectura&categories=Arquitectura%20de%20Software%20Escalable%20%26%20Robusta
```

---

### 2. Componente Visual (`src/components/RecommendationsCarousel.astro`)

**Características:**
- ✅ Carrusel tipo Netflix con scroll horizontal
- ✅ Solo iconos (Material Symbols) - SIN IMÁGENES
- ✅ Enlaces a `/aquicreamos` con parámetros search y categories
- ✅ Navegación con botones (desktop) y dots (mobile)
- ✅ Responsive y touch-friendly
- ✅ Indicadores de contexto (search/category badges)

**Props:**
```typescript
interface Props {
  title?: string;
  subtitle?: string;
  services: Array<{
    id: number;
    name: string;
    description: string;
    category: string;
    icon: string;
    searchUrl: string; // ← URL dinámica generada
  }>;
  context?: {
    search?: string;
    category?: string;
  };
}
```

---

## 🔗 Integración

### En el Home (`src/components/home.astro`)

```astro
---
import RecommendationsCarousel from "./RecommendationsCarousel.astro";
import { getHomeRecommendations, enrichServices } from "../utils/recommendations";

// Cargar servicios
let recommendedServices = [];
try {
  const servicesResponse = await fetch(new URL('/services.json', Astro.url.origin));
  const allServices = await servicesResponse.json();
  const recommendations = getHomeRecommendations(allServices);
  recommendedServices = enrichServices(recommendations);
} catch (error) {
  console.error('Error loading recommendations:', error);
}
---

<!-- Después de la sección de Servicios -->
<RecommendationsCarousel
  title="Soluciones Más Populares"
  subtitle="Soluciones tecnológicas que están transformando negocios"
  services={recommendedServices}
/>
```

### En Páginas de Servicios (ejemplo: `arquitectura.astro`)

```astro
---
import RecommendationsCarousel from "../../components/RecommendationsCarousel.astro";
import { getRecommendations, enrichServices } from "../../utils/recommendations";

// Cargar recomendaciones basadas en la categoría actual
let recommendedServices = [];
try {
  const servicesResponse = await fetch(new URL('/services.json', Astro.url.origin));
  const allServices = await servicesResponse.json();

  const currentCategory = "Oficina de Arquitectura de Software + IA";
  const recommendations = getRecommendations(allServices, {
    category: currentCategory,
    limit: 6
  });
  recommendedServices = enrichServices(recommendations);
} catch (error) {
  console.error('Error loading recommendations:', error);
}
---

<!-- Después del Hero, antes del contenido principal -->
<RecommendationsCarousel
  title="Servicios Complementarios"
  subtitle="Potencia tu arquitectura con estas soluciones"
  services={recommendedServices}
  context={{ category: "Oficina de Arquitectura de Software + IA" }}
/>
```

---

## 📍 Ejemplos de URLs Generadas

### 1. Desde Arquitectura
```
/aquicreamos?search=arquitectura&categories=Arquitectura%20de%20Software%20Escalable%20%26%20Robusta
```

### 2. Desde Microservicios
```
/aquicreamos?search=microservicios&categories=Arquitectura%20de%20Software%20Escalable%20%26%20Robusta
```

### 3. Desde Visión Computacional
```
/aquicreamos?search=visi%C3%B3n&categories=Visi%C3%B3n%20por%20Computadora%20hecha%20a%20la%20medida.%20%2B%20IA
```

### 4. Desde Full-Stack
```
/aquicreamos?search=fullstack&categories=Desarrollo%20Full-Stack
```

### 5. Desde Agentes IA
```
/aquicreamos?search=agentes&categories=Agentes%20de%20inteligencia%20artificial%20y%20MCP's
```

---

## 🎯 Estrategia de Marketing

### Cross-Selling Inteligente

El sistema recomienda servicios complementarios basándose en:

1. **Keywords de búsqueda** → Categorías relacionadas
   - "microservicios" → Arquitectura, DevOps, Apps IA
   - "visión" → Computer Vision, ML, Agentes IA
   - "web" → Full-Stack, Apps IA, DevOps

2. **Categorías complementarias**
   - Arquitectura → DevOps, Apps IA, Full-Stack
   - ML → Agentes IA, Computer Vision, DevOps
   - Full-Stack → Apps IA, DevOps, Móvil

3. **Servicios populares** (cuando no hay contexto)
   - Priorizados por volumen y potencial de cross-sell

---

## ✅ Validación

Ejecuta el script de validación:

```bash
node validate-recommendations.js
```

Esto mostrará:
- URLs generadas para cada categoría
- Número de servicios por categoría
- Validación de codificación de URLs

---

## 🎨 Diseño Visual

### Cards del Carrusel
- **Fondo:** Degradado from-gray-800/30 to-gray-900/30
- **Borde:** gray-700, hover → [#82e256]
- **Icono:** Material Symbols en contenedor con fondo [#82e256]/10
- **Badge:** Categoría en texto pequeño con fondo black/30
- **Hover:** Scale 1.05 + sombra [#82e256]/20

### Navegación
- **Desktop:** Botones chevron_left/right
- **Mobile:** Dots indicator
- **Scroll:** Smooth con gradientes fade izquierda/derecha

---

## 📦 Archivos del Sistema

```
src/
├── utils/
│   └── recommendations.ts          # Motor de recomendaciones
├── components/
│   └── RecommendationsCarousel.astro  # Componente visual
└── pages/
    ├── aquicreamos.astro          # Página destino (ya existe)
    └── servicios/
        ├── arquitectura.astro     # Ejemplo de integración
        └── ...

public/
└── services.json                   # Base de datos de servicios

validate-recommendations.js         # Script de validación
analyze-services.js                # Script de análisis
```

---

## 🚀 Estado Actual

✅ Motor de recomendaciones creado y funcionando
✅ Componente visual tipo Netflix implementado
✅ Integración en Home completada
✅ URLs dinámicas validadas
✅ Solo iconos (sin imágenes redundantes)
✅ Enlaces a `/aquicreamos` con parámetros search y categories
✅ Sistema responsive y mobile-friendly

---

## 📝 Próximos Pasos Sugeridos

1. **Integrar en todas las páginas de servicios**
   - `/servicios/agentes-ia.astro`
   - `/servicios/aplicaciones-ia.astro`
   - `/servicios/computer-vision.astro`
   - etc.

2. **Testing en producción**
   - Verificar que los filtros en `/aquicreamos` funcionan correctamente
   - Validar que todas las URLs generadas muestran resultados

3. **Analytics**
   - Trackear clics en recomendaciones
   - Medir tasa de conversión de cross-selling

---

## 💡 Notas Técnicas

- Las categorías deben coincidir **EXACTAMENTE** con las del `services.json`
- Los caracteres especiales (`&`, `+`) se codifican automáticamente
- El sistema prioriza por: volumen → cross-sell → valor estratégico
- Las keywords de búsqueda se extraen del nombre del servicio o categoría
