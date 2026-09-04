# Flujo de pantallas — Rol 3 (Fase 0)

**Responsable:** Ingeniería de Frontend y Portal de Anotación  
**Estado:** propuesta implementada para Sync 1  
**Alcance:** estructura, navegación y prototipo con datos simulados; sin persistencia real.

## 1. Objetivo

El frontend permite que una persona anotadora recorra este flujo principal:

```text
Carga de imágenes → Bandeja de imágenes → Portal de anotación
                                               ↓
                                      Guardar y siguiente
                                               ↓
                                  Siguiente imagen de la bandeja

Navegación principal ───────────────→ Dashboard
```

La navegación principal conserva acceso a **Imágenes**, **Cargar** y **Dashboard**.
Desde la bandeja se abre una imagen concreta en el portal de anotación.

## 2. Pantallas

### 2.1 Bandeja de imágenes — `/images`

**Propósito:** mostrar las imágenes disponibles y permitir continuar una anotación.

**Contenido:**

- título y resumen del total de imágenes;
- filtros visuales por estado (pendiente, en progreso y completada);
- tarjetas con miniatura, nombre, estado, dimensiones y número de anotaciones;
- acción `Anotar` o `Continuar` que abre `/annotate/:imageId`;
- estado vacío con acceso directo a la pantalla de carga.

```text
┌──────────────────────────────────────────────────────────────┐
│ Portal de anotación       Imágenes  Cargar  Dashboard        │
├──────────────────────────────────────────────────────────────┤
│ Tus imágenes                         [Todas] [Pendientes] ... │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│ │  miniatura   │ │  miniatura   │ │  miniatura   │           │
│ │ nombre       │ │ nombre       │ │ nombre       │           │
│ │ estado       │ │ estado       │ │ estado       │           │
│ │ [Continuar]  │ │ [Anotar]     │ │ [Revisar]    │           │
│ └──────────────┘ └──────────────┘ └──────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Carga de imágenes — `/upload`

**Propósito:** seleccionar una imagen y comunicar claramente las restricciones.

**Contenido:**

- zona de selección o arrastre;
- formatos aceptados: JPEG, PNG y WebP;
- tamaño máximo: 10 MB;
- resumen del archivo seleccionado;
- feedback de validación, carga, éxito y error;
- acción para volver a la bandeja.

En Fase 0 la interacción es demostrativa. La subida multipart a MinIO y su validación
en servidor pertenecen a Fase 1 y requieren coordinación con Rol 2.

```text
┌──────────────────────────────────────────────────────────────┐
│ Cargar imágenes                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Arrastra una imagen o selecciónala                       │ │
│ │ JPEG, PNG o WebP · máximo 10 MB         [Seleccionar]    │ │
│ └──────────────────────────────────────────────────────────┘ │
│ Estado / mensaje para el usuario              [Ir a imágenes]│
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Portal de anotación — `/annotate/:imageId`

**Propósito:** concentrar la selección de categoría y la edición de bounding boxes.

**Contenido:**

- nombre, estado y dimensiones de la imagen;
- paleta de categorías con su color;
- canvas escalable que conserva coordenadas en píxeles de la imagen original;
- lista y contador de cajas;
- acciones `Deshacer`, `Guardar` y `Guardar y siguiente`;
- navegación anterior/siguiente.

En el prototipo de Fase 0 se muestran cajas simuladas y se permite explorar su
selección, movimiento y cambio de tamaño solo en memoria. La persistencia real se
implementa en Fase 1.

```text
┌──────────────────────────────────────────────────────────────┐
│ ← Imágenes     calle-centro.jpg       En progreso            │
├──────────────┬───────────────────────────────┬───────────────┤
│ Categorías   │                               │ Anotaciones   │
│ ● Persona    │           CANVAS              │ #1 Persona    │
│ ● Auto       │      ┌────────────┐           │ #2 Auto       │
│ ● Bicicleta  │      │ bounding   │           │               │
│              │      │    box     │           │               │
├──────────────┴───────────────────────────────┴───────────────┤
│ [Deshacer]                       [Guardar] [Guardar y sig.]   │
└──────────────────────────────────────────────────────────────┘
```

### 2.4 Dashboard — `/dashboard`

**Propósito:** presentar las métricas agregadas por el backend para conocer el avance
real del dataset.

**Contenido:** progreso general, distribución por estado y objetos por clase. Los datos
provienen de `GET /api/dashboard/metrics`; la pantalla ofrece carga, estado vacío,
error y reintento.

## 3. Estados de interfaz acordados

| Acción | Cargando | Vacío | Éxito | Error |
| :----- | :------- | :---- | :---- | :---- |
| Listar imágenes | skeleton de tarjetas | invitación a cargar | tarjetas visibles | mensaje y reintento |
| Cargar imagen | progreso y controles bloqueados | selector disponible | confirmación y acceso a anotación | mensaje devuelto por API |
| Listar categorías | controles bloqueados | aviso: no se puede anotar | paleta disponible | mensaje y reintento |
| Guardar caja | indicador `Guardando…` | no aplica | confirmación breve | caja conservada localmente y mensaje |
| Dashboard | skeleton de métricas | métricas en cero | datos actualizados | mensaje y reintento |

## 4. Reglas de interacción

1. Ninguna bounding box se guarda sin categoría.
2. Las cajas permanecen dentro de las dimensiones originales de la imagen.
3. El canvas puede escalar visualmente, pero la API siempre recibe píxeles absolutos.
4. Los errores del servidor se muestran con su `message`; nunca se presenta un error
   500 genérico si existe un código de negocio conocido.
5. Una acción pendiente deshabilita solo los controles que podrían duplicarla.
6. El estado no depende únicamente del color: también usa texto o etiquetas.

## 5. Comportamiento responsive y accesibilidad

- Escritorio: canvas con panel de categorías y panel de anotaciones a los lados.
- Pantalla angosta: paneles apilados y navegación desplazable, sin ocultar acciones.
- Todos los controles nativos tienen etiqueta visible o `aria-label`.
- El foco de teclado es visible y el contraste usa texto oscuro sobre fondos claros.
- Los mensajes de éxito o error usan una región con `aria-live`.

## 6. Límite entre fases

**Terminado en Fase 0:** flujo documentado, rutas, componentes base, estilos y canvas
simulado.

**Pendiente de Fase 1:** carga binaria real, lectura desde API, persistencia de cajas,
estados de carga/error conectados y prueba de recarga.

**Terminado en Fase 2:** zoom, deshacer persistente, finalizar y siguiente real,
métricas, búsqueda booleana y filtros de servidor con datos de la base.
