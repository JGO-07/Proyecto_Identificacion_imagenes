# SPEC-SEARCH-01, SPEC-SEARCH-02 · RN-06, RN-07
# language: es

@wip
Característica: Búsqueda con operadores y filtros combinables
  Como anotador
  Quiero buscar imágenes por combinaciones de clases y filtros
  Para encontrar rápido el subconjunto que necesito revisar

  Antecedentes:
    Dada la imagen "A" con anotaciones de "car" y "person"
    Y la imagen "B" con anotaciones de "car"
    Y la imagen "C" con anotaciones de "person"
    Y la imagen "D" sin anotaciones

  Escenario: El operador AND exige todas las clases
    Cuando busco "car AND person"
    Entonces el resultado contiene solo la imagen "A"
    Y la consulta se resuelve en SQL

  Escenario: El operador OR admite cualquiera de las clases
    Cuando busco "car OR person"
    Entonces el resultado contiene las imágenes "A", "B" y "C"

  Escenario: Filtros combinables por clase, estado y fecha con paginación
    Dado que las imágenes "A" y "B" están en estado "in_progress"
    Cuando filtro por clase "car", estado "in_progress" y fechas del mes actual
    Y pido la página con limit 1 y offset 0
    Entonces recibo 1 resultado
    Y el total informado es 2

  Escenario: La paginación no se resuelve en memoria
    Cuando filtro por clase "car" con limit 1
    Entonces la consulta SQL incluye LIMIT y OFFSET
