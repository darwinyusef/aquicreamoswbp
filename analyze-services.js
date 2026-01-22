// Script para analizar services.json y encontrar las categorías más populares
import { readFileSync } from 'fs';

const services = JSON.parse(readFileSync('./public/services.json', 'utf-8'));

// Contar servicios por categoría
const categoryCounts = {};
services.forEach(service => {
  const category = service.category;
  if (!categoryCounts[category]) {
    categoryCounts[category] = {
      count: 0,
      services: []
    };
  }
  categoryCounts[category].count++;
  categoryCounts[category].services.push({
    id: service.id,
    name: service.name
  });
});

// Ordenar por cantidad
const sortedCategories = Object.entries(categoryCounts)
  .sort((a, b) => b[1].count - a[1].count)
  .map(([category, data]) => ({
    category,
    count: data.count,
    percentage: ((data.count / services.length) * 100).toFixed(2) + '%',
    firstService: data.services[0]
  }));

console.log('=== ANÁLISIS DE CATEGORÍAS ===\n');
console.log(`Total de servicios: ${services.length}\n`);
console.log('Top categorías por cantidad de servicios:\n');
sortedCategories.forEach((cat, index) => {
  console.log(`${index + 1}. ${cat.category}`);
  console.log(`   Servicios: ${cat.count} (${cat.percentage})`);
  console.log(`   Primer servicio: ${cat.firstService.name}\n`);
});
