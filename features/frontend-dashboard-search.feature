# SPEC-UI-DASH-01, SPEC-UI-SEARCH-01 · Rol 3, Fase 2.
# Fuente: docs/frontend-phase-2-status.md (verificación con infraestructura real).
# language: es

Característica: Dashboard y búsqueda con datos reales del servidor
  Como persona anotadora
  Quiero ver el progreso real del dataset y encontrar imágenes por clase, estado o fecha
  Para priorizar qué anotar sin revisar todo el listado a mano

  Antecedentes:
    Dado que el dashboard consume la respuesta agregada de GET /api/dashboard/metrics
    Y no calcula métricas descargando páginas parciales de imágenes

  Escenario: El dashboard refleja el estado real de la base (RN-04)
    Dado que una imagen fue marcada como "completed"
    Cuando abro el dashboard
    Entonces el progreso global cambia respecto al valor anterior
    Y veo el conteo de imágenes por estado y de objetos por categoría

  Escenario: Buscar con el operador OR devuelve imágenes de cualquiera de las clases (RN-06)
    Cuando busco "car OR person"
    Entonces la bandeja muestra solo las imágenes que la API devolvió
    Y la paginación refleja el total real de resultados

  Escenario: Filtrar por estado, categoría y fecha se resuelve en el servidor (RN-07)
    Cuando filtro por estado "in_progress"
    Entonces la bandeja se actualiza con las imágenes que cumplen el filtro
    Y el filtro se puede combinar con clase y rango de fechas sin romper la paginación

  Escenario: Estados de carga, error, reintento y resultado vacío
    Cuando una búsqueda o un filtro está en curso
    Entonces la interfaz muestra un estado de carga
    Y si la petición falla, ofrece un botón de reintento
    Y si no hay resultados, muestra un mensaje de vacío en vez de una lista en blanco

  Escenario: Deshacer revierte también en el servidor, no solo en la vista
    Dada una caja borrada
    Cuando selecciono "Deshacer"
    Entonces la API confirma la operación inversa
    Y la caja sigue existiendo después de recargar la página

  Escenario: El zoom cubre el rango completo de trabajo sin alterar las coordenadas
    Cuando ajusto el zoom
    Entonces puedo llegar hasta 50 por ciento y hasta 200 por ciento
    Y las coordenadas guardadas de cada caja no cambian en ningún nivel de zoom
