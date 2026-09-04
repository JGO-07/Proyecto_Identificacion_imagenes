# Fase 3 — Cierre (Rol 2)

Verificación técnica hecha por Rol 2 para el checklist de Fase 3: revisión
cruzada de PRs pendientes, estabilidad/protección de `main`, y ausencia de
secretos en el historial completo.

## 1. Pull Requests pendientes

Al momento de este cierre: **ninguno abierto** (`gh pr list --state open` sin
resultados). Los últimos 12 PRs de todas las fases están `MERGED`. No hay
revisión cruzada pendiente porque no hay nada esperando revisión.

## 2. `main` estable

Verificado sobre `origin/main` (commit de este cierre: ver `git log -1`):

```
npm run typecheck   -> 0 errores (servidor + cliente)
npx biome check .   -> 0 errores, 80 archivos
npm test            -> 109 tests, 14 archivos, todos en verde
npm run build       -> genera dist/server.js y dist/client sin errores
npm run test:db     -> 2 tests (integración contra MariaDB real)
```

`npm start` (con `NODE_ENV=production`) levanta en `:3100` y sirve la API y el
frontend compilado en el mismo proceso; en desarrollo `:3000` + Vite en `:5173`
siguen intactos.

## 3. `main` protegido

Ruleset **"Main Protection"** activo sobre la rama por defecto
(`repos/JGO-07/Proyecto_Identificacion_imagenes/rulesets/21955986`):

| Regla | Efecto |
| :---- | :----- |
| `deletion` | no se puede borrar `main` |
| `non_fast_forward` | no se puede forzar push (rebasear/reescribir historia) |
| `pull_request` | todo cambio a `main` debe pasar por PR |

`current_user_can_bypass: never` para las cuentas colaboradoras, confirma que
la protección aplica de verdad y no es solo decorativa para administradores.

## 4. Secretos versionados

Escaneado el **historial completo, todas las ramas** (no solo `main`/HEAD):

```bash
git log --all --diff-filter=A --name-only --pretty=format: -- '*.env*'
git log --all --follow -p -- .env.example
git log --all -p | grep -inE "AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY|sk-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}"
git log --all --diff-filter=A --name-only --pretty=format: | grep -iE "node_modules|\.(png|jpe?g|gif|bmp)$"
```

Resultado:

- El único archivo `.env*` que alguna vez se commiteó, en cualquier commit de
  cualquier rama, es `.env.example`.
- Todas las revisiones de `.env.example` (incluidas las ya reemplazadas)
  contienen solo valores de ejemplo (`app_user`, `app_secure_password`,
  `localhost`, `minio_admin`, etc.), nunca una credencial real.
- Cero coincidencias de patrones de secretos conocidos (claves AWS, tokens de
  GitHub, llaves privadas PEM, claves de API tipo `sk-`/`xox`) en todo el
  historial.
- Ningún binario de imagen ni `node_modules/` se commiteó nunca.
- `.gitignore` actual bloquea `node_modules/`, `.env`, `.env.*` y `dist/`.

**Conclusión: sin secretos versionados.** No aplica la penalización de −5.

## 5. Participación del equipo

```
git shortlog -sne origin/main
    28  Stephanie (Lógica de Negocio y API )
    16  Santiago (Frontend y Portal de Anotación)
    14  Uriel  (Arquitecto de Datos y Persistencia)
     1  Josue (PM)
```

| Persona | Rol | Commits |
| :------ | :-- | :------ |
| Stephanie (`stephyborrego04@gmail.com` + `stephy0410`) | Rol 2 | 37 |
| Sir-roboot (`santiago_ortiz_soto363@outlook.com` + alias noreply) | Rol 3 | 19 |
| ur (`urielpinag@outlook.com`) | Rol 1 | 14 |
| JGO-07 (`jdgo0507@gmail.com`) | Project Manager / dueño del repo | 1 (commit inicial) |

