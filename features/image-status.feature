# SPEC-IMG-01 · RN-05 — Estados de una imagen y transición automática.
# language: es

Característica: Estados de una imagen
  Como responsable del proyecto
  Quiero que el estado de cada imagen refleje si ya se empezó a anotar
  Para que el progreso del dashboard sea fiable

  Escenario: La primera anotación mueve la imagen de "pending" a "in_progress"
    Dada una imagen en estado "pending"
    Cuando creo su primera anotación
    Entonces la imagen queda en estado "in_progress"

  Escenario: Anotar una imagen que ya está "in_progress" no cambia su estado
    Dada una imagen en estado "in_progress"
    Cuando creo otra anotación sobre ella
    Entonces la imagen sigue en estado "in_progress"

  Escenario: Anotar una imagen "completed" no la reabre automáticamente
    Dada una imagen en estado "completed"
    Cuando creo una anotación sobre ella
    Entonces la imagen sigue en estado "completed"
