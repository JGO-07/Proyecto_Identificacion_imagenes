# SPEC-COCO-01 · REQ-DATA-005 — Estándar COCO v1.0 (exportación de dataset, Fase 2).
# language: es

Característica: Exportación del dataset en formato COCO
  Como responsable del proyecto
  Quiero exportar el dataset en el formato oficial COCO
  Para validar anotaciones y consumirlo en herramientas de entrenamiento

  Antecedentes:
    Dadas las categorías "car", "person" y "dog"
    Y las imágenes "img_auto_0.jpg" (1024 x 682) y "img_perro_0.jpg" (626 x 417)

  Escenario: Exportación exitosa con IDs cruzados consistentes
    Dado que existe una anotación con image_id referido a "img_auto_0.jpg"
    Y una anotación con category_id referido a "car"
    Cuando consulto GET /api/coco/export
    Entonces el JSON contiene las secciones "images", "annotations" y "categories"
    Y cada annotation.image_id existe entre las imágenes
    Y cada annotation.category_id existe entre las categorías
    Y no hay ids duplicados en ninguna sección

  Escenario: Bounding box en píxeles absolutos y área coherente
    Dada una anotación con x=100, y=80, width=300, height=200
    Cuando se genera el documento COCO
    Entonces la bbox es [100, 80, 300, 200]
    Y la bbox tiene exactamente 4 coordenadas positivas
    Y el área es 60000 (300 * 200)
    Y el campo iscrowd está presente y es 0 o 1

  Escenario: Rechazo ante datos geométricamente inconsistentes
    Dada una anotación cuyo image_id no existe entre las imágenes
    O una anotación cuyo category_id no existe entre las categorías
    Cuando se intenta generar el documento COCO
    Entonces la exportación falla con un error claro
    Y no se emite un documento con referencias inválidas
