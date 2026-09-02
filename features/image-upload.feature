# SPEC-IMG-02 · RN-08 — Carga de imágenes con validación en servidor.
# language: es

Característica: Carga de imágenes
  Como anotador
  Quiero subir imágenes y que el sistema rechace las no válidas con un mensaje claro
  Para no subir contenido que el portal no pueda procesar

  Antecedentes:
    Dado que el endpoint "POST /api/images/upload" recibe un archivo en el campo "file"

  Escenario: Se acepta una imagen JPEG dentro del límite de tamaño
    Cuando subo un archivo JPEG de 640 x 480 y 2 MB
    Entonces la respuesta es 201
    Y la imagen queda registrada con estado "pending"
    Y las dimensiones guardadas son 640 x 480
    Y el objeto queda en MinIO bajo "uploads/"

  Escenario: Se rechaza un formato no soportado
    Cuando subo un archivo de tipo "application/pdf"
    Entonces la respuesta es 422 con el código "INVALID_UPLOAD"
    Y el usuario ve el mensaje "Formato no soportado. Usa JPEG, PNG o WebP."

  Escenario: Se rechaza un archivo demasiado grande
    Cuando subo un archivo de tipo "image/png" de 15 MB
    Entonces la respuesta es 422 con el código "INVALID_UPLOAD"
    Y el usuario ve el mensaje "El archivo supera el máximo de 10 MB."

  Escenario: Se rechaza un archivo que dice ser imagen pero no lo es
    Cuando subo un archivo de tipo "image/png" cuyo contenido no es una imagen
    Entonces la respuesta es 422 con el código "UNREADABLE_IMAGE"

  Escenario: Falta el archivo en la petición
    Cuando envío la petición sin el campo "file"
    Entonces la respuesta es 400 con el código "NO_FILE"
