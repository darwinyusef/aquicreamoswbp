# DraggableLooper Component

Componente reutilizable para crear carruseles infinitos con funcionalidad de arrastre.

## Uso

```astro
---
import DraggableLooper from '../components/DraggableLooper.astro';
---

<DraggableLooper animationDuration="20s" gap="gap-4" id="mi-looper">
  <!-- Cards originales -->
  <div class="w-80 bg-gray-800 p-6 rounded-xl">Card 1</div>
  <div class="w-80 bg-gray-800 p-6 rounded-xl">Card 2</div>
  <div class="w-80 bg-gray-800 p-6 rounded-xl">Card 3</div>

  <!-- Cards duplicadas para loop infinito -->
  <div class="w-80 bg-gray-800 p-6 rounded-xl">Card 1</div>
  <div class="w-80 bg-gray-800 p-6 rounded-xl">Card 2</div>
  <div class="w-80 bg-gray-800 p-6 rounded-xl">Card 3</div>
</DraggableLooper>
```

## Props

- **animationDuration** (opcional): Duración de la animación (default: "30s")
- **gap** (opcional): Gap entre cards usando clases de Tailwind (default: "gap-6")
- **id** (opcional): ID único para el looper

## Características

✅ Animación infinita suave
✅ Pausa al hacer hover
✅ Arrastra con el mouse (drag-to-scroll)
✅ Cursor visual (grab/grabbing)
✅ Sin scrollbar visible
✅ Funciona con cualquier contenido

## Notas Importantes

1. **Duplicar las cards**: Debes duplicar manualmente todo el contenido dentro del componente para que el loop sea infinito
2. **Ancho fijo**: Las cards deben tener un ancho fijo (w-80, w-96, etc.)
3. **flex-shrink-0**: Se aplica automáticamente a todos los hijos
