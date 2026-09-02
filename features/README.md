# Fichas Gherkin (`.feature`)

Cada regla de negocio de [`docs/business-rules.md`](../docs/business-rules.md)
sigue la cadena:

```
Regla de negocio (RN-xx)  ->  SPEC-xx  ->  archivo .feature (Given/When/Then)  ->  prueba automatizada
```

## Convención

- Un `Feature` por regla o grupo de reglas cercanas.
- La primera línea de comentario del archivo cita el `SPEC` y la `RN`.
- `Scenario` en presente, sin detalles de implementación (nada de rutas HTTP ni
  nombres de función en el texto Gherkin; eso vive en los steps).
- Los escenarios marcados `@wip` todavía no tienen prueba verde.

## Archivos

| Archivo | Reglas |
| :------ | :----- |
| `plantilla.feature` | Plantilla de referencia (RN-08 como ejemplo) |
| `annotation-validity.feature` | RN-01, RN-02, RN-03 |
| `annotation-progress.feature` | RN-04, RN-05 |
| `search-operators.feature` | RN-06, RN-07 |
| `annotation-canvas.feature` | SPEC-UI-ANOT-01 (Rol 3, Fase 0) |

## Pruebas

Las reglas críticas ya cubiertas por pruebas automatizadas:

- RN-01 / RN-03 → `src/lib/geometry.spec.ts`
- RN-01 / RN-02 / RN-03 (validación de forma) → `src/schemas/annotation.spec.ts`

Ejecutar: `npm test`.
