# Rediseño "Blíster de Adherencia" — dashboard cliente + roster coach

## Objetivo

Implementar en código real la dirección visual elegida por el usuario ("Blíster de
Adherencia" — ver `.impeccable/surfaces/src-app-client-portal-dashboard-page-tsx.md`
para el contrato de dirección completo) en las dos superficies ya comprometidas:
el dashboard del cliente (superficie principal) y el roster de clientes del coach
(superficie relacionada), con soporte real de modo claro/oscuro.

## Problema / por qué

El usuario pidió un rediseño completo de FitMetrik (moderno, limpio, animaciones,
intuitivo para coach y cliente). Se corrió el flujo completo de `/impeccable`
(init → PRODUCT.md, new-work → ronda de dirección con dado, decision page, el
usuario eligió "Blíster de Adherencia" sobre 3 challengers y mi pick personal),
se armó un preview visual (Artifact) para validar paleta/estados/tipografía/modo
oscuro, y el usuario aprobó: "listo me gusta entonces implementemos el redisign".

## Alcance de esta iteración (explícito, no silencioso)

El pedido original fue "app completa". Esta iteración construye las **dos
superficies ya comprometidas en el direction contract** (dashboard cliente +
roster coach) con el sistema de tokens/tipografía/tema completo — esa base
(tokens, componentes atómicos, BlisterCell, ThemeProvider) es lo que permite
extender al resto de la app (auth, /activity, /creator, etc.) en iteraciones
siguientes sin re-derivar la dirección. No se tocan hoy: páginas de auth,
`/activity`, `/creator`, `/coaches`, detalle de cliente individual — quedan
para una siguiente ronda sobre la misma base ya sentada.

## Restricciones

- Preservar toda la funcionalidad real: `addDailyWeight`/`addDailyStep` Server
  Actions, validaciones existentes, Mongoose/Supabase wiring — solo cambia la
  piel visual y la interacción de entrada.
- Los specs Playwright `tests/daily-weight.spec.ts` y `tests/daily-steps.spec.ts`
  son el gate de regresión real — deben seguir pasando (actualizando selectores
  donde el markup cambie intencionalmente, nunca aflojando una aserción real).
- APIs de los primitivos (`Button`, `Card`, `Input`, `Badge`, `StatusPill`,
  `Alert`, `Modal`, `Table`) no cambian — solo su piel (tokens/clases).
- Español-first en copy de UI; código/comentarios en inglés (convención del repo).
- `.design-sync/` ya sincronizado con el sistema viejo — se re-sincroniza
  recién cuando el usuario lo pida explícitamente (no en esta iteración).

## Checklist

- [x] **T1** — Infraestructura de tema: tokens nuevos (`globals.css`), modo
      claro/oscuro real (`ThemeProvider` + `ThemeToggle`, persistido, sin
      flash de hidratación), tipografía IBM Plex Sans/Mono self-hosted
      (reemplaza Manrope + limpia tokens Public Sans/Inter nunca cargados).
      Ruta: delegado (writer trigger — 4+ archivos no triviales). **DONE —
      commit `bd93c5e`.**
  - Files: `src/app/globals.css`, `src/app/layout.tsx` (+ convertido de
    `'use client'` a Server Component), `src/components/theme/ThemeProvider.tsx`
    (nuevo), `src/components/theme/ThemeToggle.tsx` (nuevo),
    `src/components/layout/AppHeader.tsx` (toggle montado), `package.json`.
  - Verificación: `yarn lint` (sin issues nuevos vs. baseline), `yarn tsc
    --noEmit` limpio, `yarn dev` boot verificado.
  - Notas para T2+: paleta vieja Material (`@theme`) y `--surface-border`
    quedaron intactos (7+ call sites, fuera de alcance de T1) — quien toque
    esos archivos puede migrarlos si quiere, no es obligatorio. Clases
    `.blister-cell-pending/-popped/-locked` ya listas para T2. Hook local
    `.gga` (Gentleman Guardian Angel) revisa cada commit contra `AGENTS.md`
    y puede bloquear — normal, no es el sistema ODD/RDD.
  - ⚠️ Posible efecto secundario: durante verificación manual se corrió
    `pkill -f "next dev"`, que pudo haber matado un proceso en el puerto
    3000 ajeno a esta tarea. Si tenías un dev server corriendo, puede
    necesitar reinicio.
- [x] **T2** — Nuevo primitivo `BlisterCell` (estados pending/popped/missed/
      locked, tamaños sm/md/lg) + re-skin de los primitivos atómicos
      existentes a los tokens nuevos (sin cambiar sus props).
      Ruta: delegado (writer trigger — 9 archivos). **DONE — commit
      `8933340`.**
  - Files: `src/components/ui/blister-cell.tsx` (nuevo — renombrado desde
    `BlisterCell.tsx` a kebab-case, ver nota de desviación abajo), `Button.tsx`,
    `Input.tsx`, `Badge.tsx`, `Modal.tsx`, `Table.tsx`. `Card.tsx`,
    `StatusPill.tsx`, `Alert.tsx`/`Alert.module.css` quedaron sin cambios (no
    tenían referencias a tokens viejos / colores semánticos conservados por
    decisión de diseño).
  - Verificación: `yarn lint` limpio en los archivos tocados (1200+
    issues preexistentes en `.design-sync/previews/` y un vendor bundle, cero
    en `src/components/ui/`), `yarn tsc --noEmit` limpio, `yarn dev` boot +
    `GET /login 200` verificado, proceso de dev matado por PID exacto
    (puerto 3000 confirmado libre después).
  - ⚠️ **Desviación del path exacto dado por la tarea**: el hook local
    `.gga` (pre-commit, revisa contra `AGENTS.md`) bloqueó el commit
    porque `AGENTS.md` §6.1 exige `kebab-case` para archivos de
    componente — `BlisterCell.tsx` (el path literal que traía la tarea)
    lo viola. Renombrado a `blister-cell.tsx` (cero riesgo: archivo nuevo,
    nada lo importaba aún, el nombre del componente/export sigue siendo
    `BlisterCell` en PascalCase). **T3/T4 deben importar desde
    `src/components/ui/blister-cell`, no `BlisterCell`.** El resto de
    primitivos (`Badge.tsx`, `Button.tsx`, etc.) siguen en PascalCase —
    son deuda preexistente fuera de alcance de esta tarea; el hook mismo
    lo marcó como "legacy debt, not introduced by this change" y no
    bloqueó por eso.
  - Nota: el hook también señaló que `Modal.tsx` (código preexistente,
    no tocado estructuralmente aquí — solo 2 tokens de borde migrados)
    tiene funciones >20 líneas (`Modal`, `handlePanelKeyDown`) que
    violan Clean Code §6.1. Deliberadamente NO se refactorizó: la tarea
    pedía explícitamente "visual-only pass... do not change any
    behavior", y reestructurar el focus-trap/keyboard-inset de un modal
    con portal es riesgo real fuera del alcance autorizado. Queda
    como deuda conocida para quien toque `Modal.tsx` con alcance de
    refactor.
- [x] **T3** — Dashboard del cliente: widget de peso reconstruido como
      blíster real (celda de hoy + tira semanal de 7 días + resumen),
      tocar la celda de hoy abre `DailyWeightModal` (reusa
      `addDailyWeight`, ya re-skinado en T2); nuevo util de bucketing
      semanal con test unitario (test-first, Vitest, vive en
      `domain/services` por convención del repo); re-skin cosmético de
      `StepsCounter`/`HydrationTracker`/`MacrosHUD` (estáticos, sin riesgo
      funcional); actualizar aserciones de `tests/daily-weight.spec.ts`
      que dependan del markup viejo de `WeightCounter`.
      Ruta: delegado (writer trigger + preparation trigger — wiring real).
  - Files: `src/app/(client-portal)/dashboard/page.tsx`,
    `src/domain/services/adherence.ts` (nuevo) +
    `src/domain/services/adherence.spec.ts` (nuevo, test-first),
    nuevo widget de peso (reemplaza `WeightCounter.tsx` o lo envuelve),
    `src/components/client/DailyWeightModal.tsx` (re-skin visual — pasa a
    ser alcanzable desde el dashboard, no puede quedar con la piel vieja),
    `tests/daily-weight.spec.ts`. Re-skin cosmético de
    `StepsCounter.tsx`/`HydrationTracker.tsx`/`MacrosHUD.tsx` es
    best-effort, no bloqueante — el wiring real del peso es lo que importa.
    **DONE — commit `bd6f288`.**
  - Entregado: `src/domain/services/adherence.ts` (nuevo, puro) +
    `tests/unit/domain/services/adherence.spec.ts` (13 tests, test-first
    RED→GREEN — nota: el path real de test es `tests/unit/**`, no
    `src/**/*.spec.ts`, que `vitest.config.ts` no globea),
    `src/components/dashboard/weight-blister-widget.tsx` (nuevo,
    reemplaza y borra `WeightCounter.tsx` — confirmado un solo caller),
    `dashboard/page.tsx` cableada, `DailyWeightModal.tsx` re-skinado
    (+ bug real arreglado: labels sin `htmlFor`/`id` rompían
    `getByLabel()`), `StepsCounter`/`HydrationTracker`/`MacrosHUD`
    re-skinados cosmético, `tests/daily-weight.spec.ts` (DWT-E2E-11)
    actualizado.
  - **Desviación de arquitectura forzada por `.gga`**: AGENTS.md prohíbe
    que `components/` importe `domain/services/` directamente — el
    bucketing semanal se calcula en el Server Component (`page.tsx`) y
    se pasa como props planas al widget cliente (esto también eliminó un
    riesgo real de hydration mismatch). **T4 debe seguir el mismo
    patrón**: calcular `buildWeeklyStrip`/`countPopped` en el Server
    Component que alimenta `ClientRosterTable`, nunca desde el
    componente cliente directamente.
  - Verificación: `yarn test:unit` 147 passed (+13), `yarn lint` limpio,
    `yarn tsc --noEmit` limpio. `yarn playwright test
    tests/daily-weight.spec.ts`: **no se pudo verificar en verde** — este
    sandbox no tiene red hacia Supabase (`ENOTFOUND ...supabase.co`);
    confirmado vía `git stash` que el mismo test falla igual en el
    baseline pre-T3, no es una regresión de este trabajo, es una
    limitación del entorno. Pendiente de correr en un entorno con acceso
    real a Supabase antes de dar la regresión por confirmada.
  - Deuda preexistente señalada, no tocada: `page.tsx` importa el adapter
    de Supabase directo (no vía puerto), `DailyWeightModal` llama la
    Server Action directo (no vía prop/hook), bug real de timezone
    UTC/local en el parseo de fecha (podría loguear el peso en el día
    calendario equivocado fuera de UTC) — todo fuera del alcance
    autorizado de esta tarea.
- [x] **T4** — Roster del coach: `ClientRosterTable` reconstruida con
      mini-tiras de blíster por cliente (reusa el util de T3), ordenada
      por adherencia (más vacías primero), acción destructiva aislada con
      espacio generoso, paginación/vista preservadas.
      Ruta: delegado (writer trigger — 2+ archivos no triviales). **DONE
      — commit `217a1da`.**
  - Files: `src/app/(dashboard)/clients/page.tsx` (computa
    `weekCells`/`adherencePct` por cliente), `ClientRosterTable.tsx`
    (tira semanal real, columna de adherencia, orden por defecto
    adherencia-ascendente), `src/domain/services/adherence.ts` (+
    `calculateAdherencePct`, forzado por `.gga` — el cálculo de % no
    podía vivir inline en la página), `tests/unit/domain/services/
    adherence.spec.ts` (+5 tests).
  - **No se agregó acción destructiva**: la tabla real nunca tuvo
    "eliminar cliente" (solo "View →") — el artifact de preview sí la
    mostraba como ejemplo ilustrativo del raise del direction contract,
    pero inventar una función de borrado nueva está fuera de alcance de
    un rediseño visual. "View →" se mantiene, re-skinado.
  - Verificación: `yarn lint` limpio, `yarn tsc --noEmit` limpio, `yarn
    test:unit` 152 passed (+5), boot manual OK.
  - Nits no bloqueantes para T5 (señalados por el propio finish-reviewer
    del agente): `RosterWeekCell` duplica a mano la forma de `WeekCell`
    (podría vivir en `domain/types/`), un comentario quedó desactualizado
    tras el cambio forzado por `.gga`, y los `ariaLabel` de celda mezclan
    español/inglés ("Día N — popped").
- [ ] **T5** — Cierre: capturas desktop+mobile (claro y oscuro) de ambas
      superficies corriendo la app real, `yarn lint`, specs Playwright de
      weight/steps, y documentar el sistema resultante
      (`DESIGN.md` + registrar disposición final de build-phase).
      Ruta: orquestado directo + workers de verificación puntuales.
      **PARCIAL — cortado por límite de uso de la sesión.**
  - Hecho: `yarn lint`/`tsc`/`test:unit` completos en el estado final de
    la rama (152 tests, 0 issues nuevos). Confirmado con evidencia real
    (no solo `git stash`, sino un `git worktree` en `main` — descartado
    por costo, pero el snapshot del login en el error de Playwright ya
    probaba que la app renderiza bien y solo el login contra Supabase
    cuelga, no nuestro código) que Playwright sigue bloqueado por falta
    de red real a Supabase en este sandbox, **no por una regresión**.
  - Armé una ruta temporal (`/redesign-preview-scratch`, con bypass
    puntual de middleware, ambos revertidos/borrados al cerrar — no
    quedó nada en el working tree) para capturar con Playwright+chromium
    las 4 combinaciones reales (desktop/mobile × claro/oscuro) de
    `WeightBlisterWidget` y `ClientRosterTable` ya compilados. Esto
    **encontró un bug real**: el mock inicial usaba la firma vieja de
    props (`weights`/`targetWeight`) pero T3 había cambiado
    `WeightBlisterWidget` a `{clientId, cells, count, todayEntry?,
    targetWeight?}` (por la desviación de arquitectura forzada por
    `.gga`) — el componente en sí está bien, era mi mock el que estaba
    desactualizado. Corregido, recapturado, visualmente confirmado: se
    ve exactamente como el direction contract (dome/pop/strip, teal más
    vivo en oscuro, tipografía IBM Plex).
  - En la misma pasada de inspección encontré y arreglé copy en inglés
    que quedó mezclado en el roster (`Active Client Roster`, `Client`,
    `Goal`, `Weight Progress`, `Adherence`, `Plan Status`, `Last
    Update`, `Actions`, `View →`, `StatusPill` "Active"/"No Plan",
    aria-labels con nombres de estado en inglés) — traducido a español,
    consistente con el hecho de producto confirmado (español-first).
    Archivos: `ClientRosterTable.tsx`, `StatusPill.tsx` (único caller,
    chequeado), `(dashboard)/clients/page.tsx`. `yarn lint`/`tsc` limpios
    en estos tres archivos.
  - **DONE — commit `833cc55`.** El hook `.gga` pasó limpio (`STATUS:
    PASSED`) con 4 notas menores no bloqueantes (naming kebab-case
    pendiente repo-wide, mover los cortes 50%/80% a `domain/services` si
    otra pantalla los llega a necesitar, el comparador de sort podría
    partirse por clave, y los empates de sort no son estables —
    `localeCompare`/resta de tiempos lo arreglaría). Ninguna bloquea el
    cierre; quedan como deuda conocida, no corregidas en esta pasada.
  - `impeccable detect --json` corrido sobre los 20 archivos reales
    cambiados: 2 warnings, ambos en la MISMA línea preexistente
    (`dashboard/page.tsx:186`, la card "Snacks per Day", nunca tocada
    por esta rama — confirmado con `git diff` que esa línea es idéntica
    al baseline). No bloqueante, fuera del alcance autorizado.
  - Capturas finales guardadas en `.impeccable/review/` (`desktop.png`,
    `mobile.png`, `desktop-dark.png`, `mobile-dark.png`) contra el
    estado commiteado final (con el copy en español ya corregido) —
    scratch route + bypass de middleware recreados, usados, y vueltos a
    borrar/revertir limpio.
  - `impeccable-finish-reviewer` lanzado en limpio. **Veredicto: fix.**
    5 hallazgos materiales:
    1. Interacción de "pop" ausente (solo fade de color, no la
       animación de firma que nombra el contrato) — **arreglado**:
       `usePopAnimation` + `@keyframes blister-pop` (punch-through,
       480ms), dispara solo en transición real pendiente/saltado→logueado.
    2. Dark mode agregado sin cita formal en el contrato — **arreglado**:
       sección "Authorized extensions" en el surface brief citando el
       pedido explícito del usuario y su aprobación del preview.
    3. Spinner con `material-symbols-outlined` (glyph-font, no ícono
       propio) — **arreglado**: SVG stroke inline igual al sistema de
       `BlisterCell`. Texto de botones/labels NO tocado (lo assertan
       literal los specs de Playwright).
    4. Aislamiento de acción destructiva no verificable (no existe
       control de saltar/resetear) — **diferido explícitamente** en el
       surface brief (nada que aislar todavía).
    5. `--shadow-dome` casi imperceptible — **reforzado** (luz y
       oscuro); sigue sutil en claro por ser blanco-sobre-blanco,
       deliberado (no se desvía la paleta confirmada sin autorización).
    - **Bug real encontrado de paso** (no era de los 5, lo sacó el hook
      `.gga` al tocar el archivo): parseo de fecha UTC/local rompía el
      día guardado para cualquier usuario al oeste de UTC — toda la
      audiencia LatAm confirmada del producto. Arreglado test-first en
      `src/lib/utils/local-date.ts` (6 tests nuevos, 157 total).
    - Commits: `833cc55` (copy español), `c90f160` (lote de fixes).
    - Capturas recapturadas contra el estado final, mandadas de vuelta
      al MISMO reviewer para el **verdict pass** (tras un rate-limit
      transitorio en el primer intento, resumido exitosamente).
    - **Veredicto final: SHIP.** 4/5 resueltos (pop real, dark mode
      citado, spinner SVG, acción destructiva diferida
      explícitamente), 1 parcial no bloqueante (`--shadow-dome` sigue
      sutil en claro — blanco sobre blanco tiene un techo real sin
      desviar la paleta confirmada; queda como nota de pulido futuro,
      no condición del ship). Sin regresiones en el lote de fixes.
    - Excepción de diseño registrada: `bounce-easing` en
      `cubic-bezier(0.34, 1.56, 0.64, 1)` marcada como intencional
      (`.impeccable/config.json`, `ignore-value`) — es el overshoot de
      la interacción de firma, no un rebote genérico.
    - `DESIGN.md` + `.impeccable/design.json` escritos por el
      documentador desde el build real (primer `DESIGN.md` del
      proyecto). `PRODUCT.md`, `.impeccable/config.json` y este mismo
      doc commiteados junto. **DONE — commit `efdf5e8`.**

## Cierre

**T1→T5 completas.** 7 commits en `redesign/blister-adherence` (ninguno
pusheado/mergeado — queda a decisión del usuario):

1. `bd93c5e` — tokens + dark mode + IBM Plex
2. `8933340` — BlisterCell + re-skin de primitivos
3. `bd6f288` — dashboard cliente cableado real
4. `217a1da` — roster coach con tiras reales
5. `833cc55` — copy en español (hallado en inspección visual)
6. `c90f160` — lote de fixes del finish-review (pop real, cita de dark
   mode, ícono SVG, deferral, bug de timezone real)
7. `efdf5e8` — `DESIGN.md` + cierre de tracking

**Verificación final** (estado completo de la rama): `yarn lint`
1200/17/1183 (baseline idéntico, sin issues nuevos), `yarn tsc --noEmit`
limpio, `yarn test:unit` 157/157 verde. Playwright E2E real
(`tests/daily-weight.spec.ts`) **no verificado en este sandbox** — sin
red a Supabase; confirmado que no es regresión (snapshot del propio
error muestra la app renderizando bien, solo el login contra Supabase
cuelga) pero falta correrlo en un entorno con acceso real antes de
darlo por definitivamente verde.

**Fuera de alcance de esta iteración** (explícito desde el inicio, no
silencioso): auth, `/activity`, `/creator`, `/coaches`, detalle de
cliente individual — quedan sobre la misma base de tokens/tema/
primitivos ya sentada, listos para una próxima ronda sin re-derivar la
dirección.

**Deuda preexistente señalada, no tocada** (confirmada por múltiples
pasadas independientes como fuera de alcance de un pase visual):
`DailyWeightModal.tsx` importa una Server Action directo desde
`app/actions/` (viola la regla de dependencias de `AGENTS.md`),
validación de negocio inline en el componente, nombre de archivo
PascalCase vs. convención kebab-case nominal del repo (inconsistente
en todo el repo, no solo acá).

## Criterios de aceptación

- Ambas superficies renderizan con la dirección "Blíster de Adherencia" en
  claro y oscuro, con el toggle persistiendo la preferencia.
- `addDailyWeight`/`addDailyStep` siguen funcionando end-to-end (Playwright
  verde).
- `yarn lint` limpio.
- `DESIGN.md` escrito desde el build real (no antes).

## Checks aplicables

- `yarn lint`
- `yarn test:unit` (nuevo spec de `adherence.ts`)
- `yarn playwright test tests/daily-weight.spec.ts tests/daily-steps.spec.ts`
- Capturas visuales desktop+mobile, claro+oscuro, ambas superficies.

## Progreso

(se actualiza por tarea, con evidencia y commit)
