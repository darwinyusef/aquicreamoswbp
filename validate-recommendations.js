// Validar que las recomendaciones generan URLs correctas
import { readFileSync } from 'fs';

const services = JSON.parse(readFileSync('./public/services.json', 'utf-8'));

// Simular la función enrichService
function getSearchKeyword(service) {
  const categoryKeywords = {
    "Arquitectura de Software Escalable & Robusta": "arquitectura",
    "DevOps & Infraestructura Cloud": "devops",
    "Desarrollo Full-Stack": "fullstack",
    "Aplicaciones Nativas & Cross-Platform": "móvil",
    "Visión por Computadora hecha a la medida. + IA": "visión",
    "Aprendizaje Automático y por refuerzo + Modelos de IA": "machine learning",
    "Agentes de inteligencia artificial y MCP's": "agentes",
    "Apps con integraciones hechas a la medida + IA": "ia",
  };

  const serviceName = service.name.toLowerCase();

  if (serviceName.includes('microservicio')) return 'microservicios';
  if (serviceName.includes('arquitectura')) return 'arquitectura';
  if (serviceName.includes('visión') || serviceName.includes('vision')) return 'visión';
  if (serviceName.includes('agente')) return 'agentes';
  if (serviceName.includes('machine learning') || serviceName.includes('ml')) return 'machine learning';
  if (serviceName.includes('devops')) return 'devops';
  if (serviceName.includes('cloud')) return 'cloud';
  if (serviceName.includes('web')) return 'web';
  if (serviceName.includes('móvil') || serviceName.includes('movil')) return 'móvil';

  return categoryKeywords[service.category] || service.category.split(' ')[0].toLowerCase();
}

function enrichService(service) {
  const searchKeyword = getSearchKeyword(service);
  const category = encodeURIComponent(service.category);
  const search = encodeURIComponent(searchKeyword);

  return {
    ...service,
    searchUrl: `/aquicreamos?search=${search}&categories=${category}`,
  };
}

// Probar con cada categoría
const categories = [...new Set(services.map(s => s.category))];

console.log('=== VALIDACIÓN DE URLs DE RECOMENDACIONES ===\n');

categories.forEach(category => {
  const servicesInCategory = services.filter(s => s.category === category);
  const firstService = servicesInCategory[0];

  if (firstService) {
    const enriched = enrichService(firstService);
    console.log(`\n📁 Categoría: ${category}`);
    console.log(`   Servicios en esta categoría: ${servicesInCategory.length}`);
    console.log(`   Primer servicio: ${firstService.name}`);
    console.log(`   URL generada: ${enriched.searchUrl}`);
    console.log(`   Decodificada: /aquicreamos?search=${getSearchKeyword(firstService)}&categories=${category}`);
  }
});

// Verificar que todas las categorías únicas existen
console.log('\n\n=== CATEGORÍAS ÚNICAS ===\n');
categories.forEach((cat, i) => {
  console.log(`${i + 1}. ${cat}`);
});
