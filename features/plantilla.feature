# SPEC-XXX-00 · RN-00 — Plantilla de referencia para el resto del equipo.
# Copia este archivo, renombra, cambia el encabezado (SPEC + RN) y los escenarios.
# Regla: un Feature por regla de negocio; escenarios en presente; sin rutas HTTP
# ni nombres de función en el texto Gherkin (eso vive en los step definitions).
# Marca con @wip los escenarios que todavía no tienen prueba verde.
# language: es

Característica: <Nombre corto de la capacidad>
  Como <rol>
  Quiero <objetivo>
  Para <beneficio>

  Antecedentes:
    Dado <estado inicial común a todos los escenarios>

  Escenario: <Caso feliz>
    Cuando <acción del usuario>
    Entonces <resultado observable>
    Y <efecto secundario verificable>

  Escenario: <Caso de error con feedback claro>
    Cuando <acción inválida>
    Entonces la operación se rechaza con el código "<CODIGO_ERROR>"
    Y el usuario ve un mensaje claro

  @wip
  Escenario: <Caso pendiente de implementar>
    Cuando <acción>
    Entonces <resultado esperado aún sin cubrir por pruebas>
