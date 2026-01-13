# Plan de Correcciones de Imagenes - Servicios

## Regla Principal
**NO pueden existir en las IMAGENES:**
- Gradientes (gradient, bg-gradient-to-t, linear-gradient, radial-gradient)
- Fondos con blur o efectos
- Sombras (shadow, drop-shadow)
- Luces o efectos de iluminacion
- Bordes redondeados (rounded-2xl, rounded-full en imagenes)

## Mapeo de Imagenes por Servicio (VERIFICADO)

| Servicio | Ruta de Imagen | Estado |
|----------|----------------|--------|
| agentes-ia | /img/personaje1/01.png | OK |
| aplicaciones-ia | /img/personaje3/01.png | OK |
| desarrollo-web | /img/personaje3/01.png | OK |
| apps-moviles | /img/personaje4/01.png | OK |
| desarrollo-fullstack | /img/personaje6/01.png | OK |
| computer-vision | /img/personaje7/01.png | OK |
| devops-infraestructura | /img/personaje7/01.png | OK |
| ia-machine-learning | /img/personaje8/01.png | OK |
| arquitectura | /img/personaje8/01.png | OK |

**Ultima verificacion:** 2026-01-12

## Archivos Modificados

### Completados:
- [x] `/src/components/Servicios.astro` - Removidos drop-shadow de contenedores de carousel
- [x] `/src/pages/servicios/index.astro` - Cambiadas imagenes a personajes, removido gradient overlay
- [x] `/src/pages/servicios/computer-vision.astro` - Hero corregido
- [x] `/src/pages/servicios/ia-machine-learning.astro` - Hero corregido
- [x] `/src/pages/servicios/devops-infraestructura.astro` - Hero corregido
- [x] `/src/pages/servicios/desarrollo-fullstack.astro` - Hero corregido

### Verificados (Correctos):
- [x] `/src/pages/servicios/agentes-ia.astro` - Hero OK: personaje1/01.png
- [x] `/src/pages/servicios/aplicaciones-ia.astro` - Hero OK: personaje3/01.png
- [x] `/src/pages/servicios/desarrollo-web.astro` - Hero OK: personaje3/01.png
- [x] `/src/pages/servicios/apps-moviles.astro` - Hero OK: personaje4/01.png
- [x] `/src/pages/servicios/arquitectura.astro` - Hero OK: personaje8/01.png

## Estructura Correcta del Hero (Sin efectos)

```astro
<!-- CORRECTO - Sin gradientes, sombras ni rounded -->
<div class="relative">
  <img
    src="/img/personajeX/01.png"
    alt="Descripcion del servicio"
    class="max-w-md w-full"
  />
</div>

<!-- INCORRECTO - Con efectos a remover -->
<div class="relative">
  <div class="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl"></div>
  <img
    src="/img/personaje.png"
    alt="..."
    class="relative rounded-2xl shadow-2xl max-w-md w-full"
  />
</div>
```

## Clases CSS a Eliminar de Imagenes

- `rounded-2xl`, `rounded-xl`, `rounded-lg`, `rounded-full`
- `shadow-2xl`, `shadow-xl`, `shadow-lg`, `drop-shadow-*`
- `bg-gradient-*`
- Divs con `blur-xl` y gradientes que envuelven imagenes

## Notas Adicionales

- Las imagenes usan `object-contain` en lugar de `object-cover` en el index
- El fondo de las cards puede ser `bg-gray-900` para contraste
- Los badges de categoria NO deben tener `rounded-full`
