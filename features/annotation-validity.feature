# SPEC-ANOT-01, SPEC-ANOT-02, SPEC-ANOT-03 · RN-01, RN-02, RN-03
# language: es

Característica: Validez de una anotación
  Como anotador
  Quiero que solo se guarden cajas coherentes y con clase
  Para que el dataset exportado a COCO sea consistente

  Antecedentes:
    Dada una imagen "calle.jpg" de 640 x 480 píxeles
    Y una categoría "car"

  Escenario: Se guarda una caja válida y se calcula su área
    Cuando creo una anotación en (10, 10) de 100 x 50 con categoría "car"
    Entonces la anotación se guarda
    Y su área es 5000
    Y su campo isCrowd es 0

  Escenario: El área enviada por el cliente se ignora
    Cuando creo una anotación en (0, 0) de 20 x 20 con categoría "car" y área 999999
    Entonces la anotación se guarda
    Y su área es 400

  Escenario: Se rechaza una caja que se sale de la imagen
    Cuando creo una anotación en (600, 10) de 100 x 100 con categoría "car"
    Entonces la anotación se rechaza con el código "BBOX_OUT_OF_BOUNDS"

  Escenario: Se rechaza una caja con ancho no positivo
    Cuando creo una anotación en (10, 10) de 0 x 50 con categoría "car"
    Entonces la anotación se rechaza con el código "VALIDATION_ERROR"

  Escenario: Se rechaza una caja sin categoría
    Cuando creo una anotación en (10, 10) de 30 x 30 sin categoría
    Entonces la anotación se rechaza con el código "VALIDATION_ERROR"

  Escenario: Se rechaza una caja con una categoría inexistente
    Cuando creo una anotación en (10, 10) de 30 x 30 con categoría 999
    Entonces la anotación se rechaza con el código "CATEGORY_NOT_FOUND"

  Escenario: No se puede borrar una categoría en uso
    Dado que existe una anotación con categoría "car"
    Cuando intento borrar la categoría "car"
    Entonces la operación se rechaza con el código "CATEGORY_IN_USE"
