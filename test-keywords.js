// Probar que las keywords generadas funcionan en la búsqueda
import { readFileSync } from 'fs';

const services = JSON.parse(readFileSync('./public/services.json', 'utf-8'));

// Simular búsqueda en /aquicreamos
function searchServices(keyword, category = null) {
  const query = keyword.toLowerCase();

  let results = services.filter(s =>
    s.name.toLowerCase().includes(query) ||
    s.description.toLowerCase().includes(query) ||
    s.category.toLowerCase().includes(query)
  );

  if (category) {
    results = results.filter(s => s.category === category);
  }

  return results;
}

console.log('=== PRUEBA DE KEYWORDS ===\n');

const tests = [
  { keyword: 'desarrollo', category: 'Desarrollo Full-Stack' },
  { keyword: 'ia', category: 'Aprendizaje Automático y por refuerzo + Modelos de IA' },
  { keyword: 'arquitectura', category: 'Arquitectura de Software Escalable & Robusta' },
  { keyword: 'agentes', category: "Agentes de inteligencia artificial y MCP's" },
  { keyword: 'aplicaciones', category: 'Aplicaciones Nativas & Cross-Platform' },
  { keyword: 'integraciones', category: 'Apps con integraciones hechas a la medida + IA' },
  { keyword: 'visión', category: 'Visión por Computadora hecha a la medida. + IA' },
  { keyword: 'devops', category: 'DevOps & Infraestructura Cloud' },
];

tests.forEach(({ keyword, category }) => {
  const results = searchServices(keyword, category);
  const status = results.length > 0 ? '✅' : '❌';

  console.log(`${status} Keyword: "${keyword}" | Categoría: ${category}`);
  console.log(`   Resultados: ${results.length} servicios`);
  if (results.length > 0) {
    console.log(`   Primer servicio: ${results[0].name}`);
  } else {
    console.log(`   ⚠️  NO HAY RESULTADOS - KEYWORD NO FUNCIONA`);
  }
  console.log();
});

// Probar keywords sin categoría (búsqueda general)
console.log('\n=== BÚSQUEDA GENERAL (sin filtro de categoría) ===\n');

['desarrollo', 'ia', 'arquitectura', 'agentes', 'aplicaciones'].forEach(keyword => {
  const results = searchServices(keyword);
  console.log(`"${keyword}": ${results.length} resultados totales`);
});
