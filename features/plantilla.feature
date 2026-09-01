# SPEC-IMG-02 · RN-08 — Plantilla de referencia para el resto del equipo.
# Copia este archivo, cambia el encabezado y los escenarios.
# language: es

Característica: Validación de carga de imágenes
  Como anotador
  Quiero que el sistema rechace archivos no válidos con un mensaje claro
  Para no subir contenido que el portal no pueda procesar

  Antecedentes:
    Dado que existe el bucket de almacenamiento "annotation-images"

  Escenario: Se acepta una imagen JPEG dentro del límite de tamaño
    Cuando subo un archivo "gato.jpg" de tipo "image/jpeg" y 2 MB
    Entonces la carga se realiza con éxito
    Y la imagen queda registrada con estado "pending"

  Escenario: Se rechaza un formato no soportado
    Cuando subo un archivo "notas.pdf" de tipo "application/pdf" y 1 MB
    Entonces la carga se rechaza con el código "VALIDATION_ERROR"
    Y el usuario ve el mensaje "Formato no soportado. Usa JPEG, PNG o WebP."

  Escenario: Se rechaza un archivo demasiado grande
    Cuando subo un archivo "panorama.png" de tipo "image/png" y 15 MB
    Entonces la carga se rechaza con el código "VALIDATION_ERROR"
    Y el usuario ve el mensaje "El archivo supera el máximo de 10 MB."
