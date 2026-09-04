# REQ-DATA-001, REQ-DATA-002, REQ-DATA-003, REQ-DATA-004 · Rol 1, Fase 1.
# Fuente: docs/phase_1_requirements_role_1.md (fichas 1-4).
# language: es

Característica: Cimientos de persistencia (esquema, migraciones, seeder y MinIO)
  Como equipo de desarrollo
  Quiero que el esquema relacional, las migraciones, el seeder y el almacenamiento
  de archivos sean reproducibles y consistentes
  Para que cualquier persona levante el proyecto desde cero sin intervención manual

  Escenario: El esquema garantiza tipos e índices requeridos por COCO y las búsquedas (REQ-DATA-001)
    Dado el esquema relacional de "categories", "images" y "annotations"
    Entonces "images.file_name" es único
    Y existen índices sobre "images.status", "images.created_at", "annotations.image_id" y "annotations.category_id"
    Y las coordenadas de una anotación se almacenan como números reales absolutos

  Escenario: Las migraciones reconstruyen el esquema en una base limpia (REQ-DATA-002)
    Dada una base de datos MariaDB recién creada, sin tablas
    Cuando ejecuto "npm run db:migrate"
    Entonces las tablas "categories", "images" y "annotations" existen con sus índices y llaves foráneas
    Y no fue necesario ejecutar SQL manual

  Escenario: El seeder es idempotente (REQ-DATA-003)
    Dado que la base de datos está vacía
    Cuando ejecuto "npm run db:seed" dos veces seguidas
    Entonces existen exactamente 5 categorías y 8 imágenes
    Y la segunda ejecución no duplica ningún registro

  Escenario: El almacenamiento de binarios se aísla en MinIO (REQ-DATA-004)
    Cuando ejecuto "npm run storage:test"
    Entonces el bucket configurado se crea si no existe
    Y un objeto subido se recupera con el mismo contenido
    Y ningún binario de imagen se guarda en MariaDB
