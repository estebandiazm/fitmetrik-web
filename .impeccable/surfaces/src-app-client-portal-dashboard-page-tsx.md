---
version: 1
slug: "src-app-client-portal-dashboard-page-tsx"
primary_target: "src/app/(client-portal)/dashboard/page.tsx"
related_targets: ["src/app/(dashboard)/clients/page.tsx"]
---

## Direction contract

THESIS: El plan nutricional no es un documento para leer, es una dosis para tomar — cada día es una celda de blíster que el cliente "pop-ea" o deja vacía, y el trabajo del coach es escanear qué celdas quedaron sin pop. Refusa el dashboard genérico de cards planas + grid de stat-tiles que domina la categoría fitness/SaaS.

OWN-WORLD: Fondo blanco/gris clínico-confiable tipo lámina de blíster (`#F4F6F8` base, `#C7CCD1` divisores plateados), un acento de color por métrica trackeada (no por cliente) — teal `#2DD4BF` para peso, ámbar `#F59E0B` para pasos/actividad. La celda del día es el átomo estructural: domo elevado = pendiente, hueco punzado/relleno = logueado, tachado tenue = explícitamente saltado (nunca solo vacío-ambiguo), con candado visual = futuro/bloqueado. Tipografía: numerales tabulares para todas las métricas, sans compacta estilo etiqueta médica para encabezados de día/fecha, números grandes estilo "dosis" para "X/7 esta semana". Grid de 7 celdas = una semana; semanas se apilan verticalmente (binder).

STORY: El cliente abre la app, ve la celda de hoy esperando su pop — un vistazo le dice si va bien esta semana; "pop-ear" es el ritual diario. El coach abre el roster, ve la tira-semana de cada cliente a la vez, ordenada por más-celdas-vacías-primero — las celdas vacías saltan a la vista sin entrar a cada perfil.

FIRST VIEWPORT (cliente, mobile — superficie principal de este primer build): la celda de hoy grande y centrada arriba, sin pop; debajo la tira completa de la semana (7 celdas) a menor escala; un tap en la celda de hoy dispara la animación de pop (la interacción de firma); debajo de la tira, un resumen compacto "4/7 esta semana" en número grande. Acciones destructivas (saltar explícitamente un día, resetear) viven aisladas, con espacio generoso, nunca pegadas al botón de pop.

FORM: Candidato fundamentado #3 de 7 (blíster de adherencia farmacéutica), de mi propia lista ordenada por resonancia. Seed key `9cf4e04a` (scope: direction, mode: operate). Elegido por el usuario sobre: mi pick personal (Tarjetas Fintech LatAm), 3 challengers competitivos (Tablero Split-Flap, Manual con Pestañas de Acetato, Rack de Horarios) y el estándar de categoría — ver raises donados por los challengers declinados (vocabulario de estado nombrado, aislamiento de acciones destructivas, negative space confiado) ya incorporados en OWN-WORLD/FIRST VIEWPORT arriba.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Authorized extensions (post-lock, cited)

**Dark mode / ThemeToggle** — not in the original OWN-WORLD block (light-only
at lock time). Added on explicit user request mid-session, after the
direction was already locked: user asked "podemos agregar soporte a dark
mode?"; a two-theme preview (both palettes, all cell states, both surfaces)
was built as an Artifact and shown before any production code was written;
user confirmed "listo me gusta" before implementation began. This is a
cited, user-authorized extension to OWN-WORLD, not an uncited addition — the
dark palette (`#12151B` base, `#34E6CF` brighter-in-dark teal accent) is
derived from the same material logic as light (blister foil under dim
light, not an inverted/generic dark theme). Flagged by finish review for
lack of citation in this document at the time of review — this section is
that citation, added during the fix round rather than reverting the
feature the user explicitly asked for and approved.

**Destructive-action isolation — deferred, not implemented.** FIRST
VIEWPORT names this ("Acciones destructivas... viven aisladas"), but no
skip/reset control exists anywhere in the shipped two-surface scope to
apply it to — there was nothing to isolate. Explicitly deferred to
whichever future task adds a skip/reset affordance; not silently dropped.
