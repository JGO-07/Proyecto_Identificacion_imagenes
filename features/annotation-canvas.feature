# SPEC-UI-ANOT-01 · Flujo del canvas del Rol 3 (Fase 0).
# language: es

@wip
Característica: Manipulación básica de bounding boxes
  Como persona anotadora
  Quiero crear y ajustar cajas sobre una imagen
  Para delimitar cada objeto con precisión antes de guardar

  Antecedentes:
    Dada una imagen "calle.jpg" de 1920 x 1080 píxeles
    Y las categorías "Persona" y "Automóvil"
    Y que seleccioné la categoría "Persona"

  Escenario: Crear una caja dentro de la imagen
    Cuando dibujo una caja desde (120, 80) hasta (360, 300)
    Entonces aparece una caja de 240 x 220 píxeles
    Y la caja muestra la categoría "Persona"
    Y la caja permanece completamente dentro de la imagen

  Escenario: Impedir una caja sin categoría
    Dado que no hay una categoría seleccionada
    Cuando intento dibujar una caja
    Entonces la caja no se crea
    Y veo el mensaje "Selecciona una categoría antes de dibujar"

  Escenario: Mover una caja existente
    Dada una caja de "Persona" en (120, 80) de 240 x 220 píxeles
    Cuando la arrastro a la posición (300, 180)
    Entonces la caja conserva su tamaño de 240 x 220 píxeles
    Y su nueva posición es (300, 180)

  Escenario: Redimensionar una caja existente
    Dada una caja de "Persona" en (300, 180) de 240 x 220 píxeles
    Cuando arrastro su esquina inferior derecha hasta (620, 520)
    Entonces la caja mide 320 x 340 píxeles
    Y la caja permanece completamente dentro de la imagen

  Escenario: Conservar coordenadas absolutas en un canvas escalado
    Dado que la imagen se muestra al 50 por ciento de su tamaño original
    Cuando muevo visualmente una caja 50 píxeles a la derecha
    Entonces su coordenada horizontal original aumenta 100 píxeles
