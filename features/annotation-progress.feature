# SPEC-DASH-01, SPEC-IMG-01 · RN-04, RN-05
# language: es

@wip
Característica: Progreso de anotación
  Como responsable del proyecto
  Quiero ver el avance real calculado desde la base de datos
  Para saber cuánto falta sin confiar en valores fijos

  Antecedentes:
    Dadas 4 imágenes cargadas
    Y las categorías "car" y "person"

  Escenario: El progreso global refleja las imágenes completadas
    Dado que 1 imagen está en estado "completed"
    Cuando consulto las métricas del dashboard
    Entonces el progreso global es 25 por ciento

  Escenario: El desglose por clase cuenta anotaciones reales
    Dado que hay 3 anotaciones de "car" y 2 de "person"
    Cuando consulto las métricas del dashboard
    Entonces el conteo de "car" es 3
    Y el conteo de "person" es 2

  Escenario: Las métricas cambian al agregar una anotación
    Dado que el conteo de "car" es 3
    Cuando creo una anotación nueva de "car"
    Entonces el conteo de "car" es 4

  Escenario: La primera anotación mueve la imagen a "in_progress"
    Dada una imagen en estado "pending"
    Cuando creo su primera anotación
    Entonces la imagen queda en estado "in_progress"
