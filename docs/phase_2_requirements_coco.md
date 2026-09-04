# Ficha de Requerimiento y SPEC de Exportación COCO (Fase 2)

**Rol:** Arquitecto de Datos y Persistencia (Rol 1)  
**Rama:** `feat/phase-2-ur`  
**Objetivo:** Generar el dataset completo en el formato oficial de COCO v1.0,
descargable vía HTTP, garantizando consistencia referencial y geometría correcta.

---

## 1. Ficha Técnica del Requerimiento

| Campo              | Valor                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **ID**             | `REQ-DATA-005`                                                     |
| **Título**         | Exportación del dataset en formato COCO v1.0                       |
| **Regla de Negocio** | El estándar de anotación **COCO version 1.0** define un JSON con las secciones `images`, `annotations` y `categories`, todas con ids enteros **cruzados consistentes**; cada `annotation.image_id` y `annotation.category_id` debe existir, el `bbox` se expresa en `[x, y, width, height]` en **píxeles absolutos**, el `area` es coherente (`width * height`) y el flag `iscrowd` está presente explícitamente (`0` o `1`). |
| **Entregable**     | `src/services/coco-export.service.ts` + rutas de descarga HTTP.     |
| **Criterio de rúbrica asociado** | Sección 6 (Salida del dataset COCO): 6.1 estructura/ids, 6.2 bbox/área/iscrowd, 6.3 exportación descargable. |

---

## 2. Mapeo de Esquema → JSON COCO

La transformación es 1:1 entre las tablas de MariaDB y el documento final, y
vive en `mapToCoco()` dentro de `src/services/coco-export.service.ts`.

| Sección COCO | Origen (tabla)      | Campo de salida          | Regla                                |
| ------------ | ------------------- | ------------------------ | ------------------------------------ |
| `images`     | `images`            | `id`                     | `images.id`                          |
| `images`     | `images`            | `file_name`              | `images.file_name`                   |
| `images`     | `images`            | `width`, `height`        | dimensiones exactas en píxeles       |
| `annotations`| `annotations`       | `id`                     | `annotations.id`                     |
| `annotations`| `annotations`       | `image_id`, `category_id`| enlaces cruzados validados           |
| `annotations`| `annotations`       | `bbox`                   | `[x, y, width, height]` absolutos    |
| `annotations`| `annotations`       | `area`                   | `width * height` (calculado)         |
| `annotations`| `annotations`       | `iscrowd`                | `0` o `1` desde `is_crowd`           |
| `categories` | `categories`        | `id`, `name`             | `categories.id`, `categories.name`   |

**Validaciones aplicadas durante el mapeo (antes de producir el JSON):**

- No se permiten ids duplicados entre imágenes ni entre categorías.
- Cada `annotation.image_id` debe existir en `images`; cada `annotation.category_id`
  debe existir en `categories`; de lo contrario se **lanza un error** (nunca se
  emite un dataset inválido).
- `bbox` es exactamente un array de 4 coordenadas numéricas positivas.

---

## 3. Especificación Gherkin (Given / When / Then)

> La versión ejecutable de estos escenarios está en
> [`features/coco-export.feature`](../features/coco-export.feature) y la
> verificación automatizada correspondiente en
> `src/services/coco-export.spec.ts` + `src/api/api.spec.ts`.

```gherkin
# SPEC-COCO-01 · REQ-DATA-005 — Estándar COCO v1.0 (Fase 2).
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
```

---

## 4. Prueba de Mutación (criterio de rúbrica 8.3)

El objetivo es demostrar que la prueba realmente observa la lógica y **falla**
cuando esta se rompe, es decir, que no es una aserción pasiva que siempre pasa.

**Quién la implementa:** `src/services/coco-export.spec.ts`, operando sobre la
función pura `mapToCoco()` de `src/services/coco-export.service.ts`.

**Mutación 1 — Inversión de dimensiones (`width`/`height`):** la spec exige que
`bbox` conserve el orden absoluto `[x, y, width, height]` y que `area` sea
`width * height`. Si la implementación invierte el orden de las coordenadas, la
aserción `expect(annotation.bbox).toEqual([x, y, width, height])` deja de
cumplirse y el test cae. **Resultado verificado:** romper la implementación
produjo `1 failed | 5 passed` (el test de bbox falló).

**Mutación 2 — Eliminación de la validación referencial:** la spec espera que
una anotación con `image_id` o `category_id` inexistente provoque un error
(`toThrow(/imagen inexistente/i)` y `toThrow(/categoría inexistente/i)`). Si se
neutraliza esa validación, la exportación deja de lanzar y los tests caen.
**Resultado verificado:** al neutralizar ambas validaciones la suite quedó en
`3 failed | 3 passed` (los tres tests de mutación/integridad fallaron).

Tras la verificación se restauró la implementación original y la suite volvió a
`105/105` en verde, quedando intacto el comportamiento correcto.

---

## 5. Referencias

- Implementación: `src/services/coco-export.service.ts` (`mapToCoco`, `buildCocoDataset`).
- Rutas HTTP: `src/api/routes/coco.ts` (`GET /api/coco/export`, `GET /api/coco/dataset.json`).
- Pruebas: `src/services/coco-export.spec.ts`, `src/api/api.spec.ts`.
- Convención de REQ-ID: `docs/phase_1_requirements_role_1.md` (`REQ-DATA-001` a `REQ-DATA-004`).
