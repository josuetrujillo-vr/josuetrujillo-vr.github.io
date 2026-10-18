# De persona a sistema — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el portfolio en una presentación de Josue como desarrollador versátil, cuyo retrato se transforma en conexiones, proyectos y firma.

**Architecture:** Mantener HTML semántico y CSS como experiencia completa; añadir una escena decorativa compartida mediante módulos JavaScript nativos. Proyectar puntos y segmentos con coordenadas x/y/z sobre Canvas 2D y coordinar sus destinos mediante scroll nativo. La imagen original mantiene la fidelidad del rostro durante el inicio.

**Tech Stack:** HTML, CSS, módulos .mjs, Canvas 2D, requestAnimationFrame y pruebas con node:test en Node 22.23.2, disponible en el equipo. Sin framework, gestor de paquetes ni dependencias nuevas de producción.

**Spec:** ../specs/2026-10-17-portfolio-design.md — aprobada por el usuario en este chat el 2026-10-17.

## Global Constraints

- Frase principal exacta: «Conecto código, procesos y personas».
- Nombre visible: Josue Trujillo. Nombre completo en metadatos y cierre: Josue Trujillo Zenon.
- Mantener la publicación estática de GitHub Pages y el directorio docs como raíz pública.
- Usar scroll nativo. No interceptar la rueda ni imponer navegación por pantallas.
- Web, sistemas y VR tienen presencia explícita y casos comprensibles.
- No fabricar capturas, testimonios, métricas ni enlaces a demos.
- Ninguna sección queda oculta esperando una clase de animación.
- Los proyectos, trayectoria, educación, certificaciones y contactos existentes se conservan.
- Con movimiento reducido: imagen estática y composiciones sin desarme, movimiento ambiental ni inclinación.
- Referencias de comprobación: 1440 × 900 y 390 × 844; mínimo medio de 45 y 30 fotogramas por segundo respectivamente durante diez segundos; sin tareas de escena superiores a 100 ms.
- La vista móvil emulada no sustituye una prueba en un teléfono físico.
- No publicar automáticamente. La revisión final debe incluir capturas y límites de validación.

## Review Focus

1. Entrar directamente a #contact o recargar a mitad de página: contenido y escena corresponden al scroll actual. Prueba de modelo en tarea 2 y comprobación de navegador en tarea 4.
2. Cambiar orientación o tamaño durante un morph: no regenerar partículas ni perder identidad. Prueba de estabilidad en tarea 2 y comprobación de navegador en tarea 4.
3. Imagen vacía, fallo de carga o contexto gráfico no disponible: conservar contenido y alternativa estática. Pruebas de datos en tarea 2 y prueba de recuperación en tarea 3.
4. Cambiar movimiento reducido, pausa o visibilidad durante la sesión: sin bucles duplicados; nunca reanudar movimiento ambiental contra la preferencia. Comprobación de ciclo de vida en tarea 4.
5. Equipos lentos, puntero táctil y DPR alto: reducir detalle sin afectar navegación, texto o lectura. Presupuestos y medición en tarea 5.

## Archivos y responsabilidades

Rutas relativas a la raíz del repositorio.

- Modificar docs/index.html: contenido, navegación, imagen accesible, espacios de escena y diagramas estáticos.
- Modificar docs/assets/style.css: nueva composición, tipografía, color, estados y adaptación.
- Crear docs/assets/images/portrait-original.png: copia exacta de la imagen aportada.
- Crear docs/assets/images/portrait.webp: derivado optimizado, conservando proporción, hasta 1280 px en el lado mayor.
- Crear docs/assets/scene-model.mjs: muestreo reproducible, destinos geométricos y progreso puro.
- Crear docs/assets/scene-renderer.mjs: preparación y dibujo de la escena; sin controles de navegación.
- Crear docs/assets/main.mjs: carga, mediciones, scroll, preferencias, pausa y ciclo de renderizado.
- Crear tests/scene-model.test.mjs: comprobaciones del comportamiento geométrico y continuidad.
- Crear tests/scene-renderer.test.mjs: recuperación al no disponer de contexto; sin simular todos los métodos de Canvas.
- Crear docs/superpowers/verification/2026-10-17-portfolio.md: resultados de aceptación y rendimiento.
- Actualizar README.md: ejecutar servidor local, pruebas y límites de los recursos visuales.

Capturas y resultados destinados al usuario: carpeta outputs del chat. Usar work del chat para experimentos y recursos temporales, sin añadirlos a la publicación.

## Decisiones de implementación

- Colores iniciales: fondo #08090b, texto #f2eee7, secundario #aaa9a5 y acento #ff8759. Verificar contraste de cada uso.
- Mantener Inter de la carga existente, con system-ui como alternativa; retirar Cinzel, Marcellus y el script de Lucide. Iconos esenciales como SVG inline.
- Lienzo fijo decorativo, sin capturar eventos, con composición screen para integrar el negro del retrato. El contenido se dibuja en HTML por encima.
- Cada capítulo tiene un espacio visual medible data-scene-slot; el lienzo usa esos rectángulos, no coordenadas inventadas junto al texto.
- Orden fijo de escenas: portrait, branches, web, systems, vr, trajectory, signature.
- Extraer píxeles del retrato una sola vez, a un máximo de 256 × 256 px. Conservar el PNG original y usar WebP en pantalla; derivarlo con una conversión técnica local, sin alterar el contenido visual.
- Modelo base de 3600 puntos; dibujar un subconjunto estable de 1600 en pantallas estrechas o con puntero grueso. Tope de resolución de lienzo: DPR 1.5 en escritorio y 1 en móvil.
- Agrupar conexiones de vecindad al preparar el modelo, hasta dos por punto. Sin búsqueda de vecinos por parejas en cada frame.
- Geometrías: tres ramificaciones, planos de interfaz, flujo de módulos, volumen espacial, línea de trayectoria y letras JT. Cada destino conserva cantidad y orden de puntos.
- El cursor inclina levemente la composición, hasta 0.035 radianes por eje; solo con hover y puntero fino.
- Las cifras de calidad son presupuestos iniciales: reducir cantidad dibujada y DPR si las mediciones de tarea 5 lo exigen, manteniendo el modelo estable.

---

### Task 1: Portfolio estático completo y recurso original

**Files:** docs/index.html, docs/assets/style.css, docs/assets/images/portrait-original.png, docs/assets/images/portrait.webp.
**Consumes:** contenido profesional del HTML actual e imagen temporal aportada.
**Produces:** página funcional sin JavaScript, anclas y espacios visuales que consume la escena.

- [ ] Inspeccionar instrucciones AGENTS vigentes y estado Git. Crear aislamiento mediante using-git-worktrees al comenzar ejecución; incluir la especificación y este plan desde el commit de documentación.
- [ ] Copiar exactamente C:/Users/truji/AppData/Local/Temp/codex-clipboard-c7ab7d1f-4f8b-4f19-99b2-07786c700073.png a portrait-original.png; verificar igualdad con Get-FileHash. Crear el derivado WebP y comprobar reconocimiento y proporción del rostro.
- [ ] Reescribir la presentación con la frase exacta y descripción aprobada. Enlaces Explorar proyectos y Contactar; navegación Proyectos, Trayectoria y Contacto; enlace de salto al contenido.
- [ ] Organizar proyectos en este orden: universidad, Odoo/ingeniería y VR. Conservar DIF y otros trabajos como casos adicionales; trasladar experiencia, educación y certificaciones sin perder sus datos. Usar diagramas SVG inline identificados como representaciones donde falten capturas reales.
- [ ] Mantener #hero, #about, #projects, #experience, #skills, #education y #contact para enlaces existentes. Añadir #project-web, #project-systems y #project-vr. Poner data-scene-slot en los espacios de portrait, branches, web, systems, vr, trajectory y signature.
- [ ] Conservar los contactos y GitHub actuales. Resolver mailto y tel sin depender de JavaScript; no publicar esos datos en logs o capturas de QA innecesarias.
- [ ] Sustituir el tema y textos asociados a Genshin. Diseñar entrada en dos columnas, proyectos asimétricos y móvil de una columna. Imagen con alt y dimensiones reservadas; diagramas decorativos fuera del árbol accesible.
- [ ] Iniciar servidor de lectura local desde la raíz: python -m http.server 4173 --bind 127.0.0.1 --directory docs. Revisar http://127.0.0.1:4173/ a 1440 × 900 y 390 × 844. Resultado: frase, imagen, casos, trayectoria y contacto legibles; sin desbordamiento horizontal y sin requerir JavaScript.
- [ ] Guardar capturas de entrada, proyectos y contacto en outputs. Revisar visualmente antes del commit. Commit: feat: redesign static portfolio around filament portrait.

### Task 2: Modelo reproducible de retrato y transformaciones

**Files:** docs/assets/scene-model.mjs; tests/scene-model.test.mjs.
**Consumes:** píxeles RGBA del retrato y mediciones de capítulos.
**Produces:**
- buildPortraitModel({data: Uint8ClampedArray, width: number, height: number}, count: number, seed: number): Model.
- Model: {positions: Float32Array, edges: Uint32Array, release: Float32Array}; tres coordenadas por punto, pares de índices por conexión, un umbral de desprendimiento por punto.
- makeTargets(stage: Stage, count: number, seed: number): Float32Array; Stage toma los siete valores de escena definidos arriba.
- sceneFrame(scrollY: number, milestones: Array<{stage: Stage, y: number}>): Frame.
- Frame: {from: Stage, to: Stage, mix: number}. Inicio y final usan from === to y mix === 0.
- projectPoint(point: {x: number, y: number, z: number}, viewport: {width: number, height: number}, pointer: {x: number, y: number}): {x: number, y: number, scale: number}.

- [ ] Escribir las pruebas portrait_is_deterministic, empty_pixels_return_empty_model y sparse_pixels_resample_safely: misma imagen y semilla dan modelos idénticos; imagen totalmente negra produce modelo vacío; alfa cero no crea puntos; fuentes con pocos píxeles visibles producen exactamente count puntos por remuestreo estable, sin índices inválidos.
- [ ] Escribir targets_preserve_point_identity para los siete destinos: longitud count * 3, valores finitos e identidad de resultados al repetir la semilla. Añadir resize_preserves_source_positions: los cambios de viewport afectan solo a la proyección y no mutan positions.
- [ ] Escribir scroll_is_reversible para scroll inverso y entrada intermedia con estos valores:

```js
const marks = [{ stage: 'portrait', y: 0 }, { stage: 'branches', y: 100 }];
assert.deepEqual(sceneFrame(50, marks), {
  from: 'portrait', to: 'branches', mix: 0.5
});
sceneFrame(90, marks);
assert.deepEqual(sceneFrame(50, marks), {
  from: 'portrait', to: 'branches', mix: 0.5
});
assert.deepEqual(sceneFrame(-10, marks), {
  from: 'portrait', to: 'portrait', mix: 0
});
```

- [ ] Añadir milestones_clamp_and_handle_zero_ranges con casos de último capítulo, hitos coincidentes y un solo hito; nunca dividir por cero. Para hitos coincidentes elegir el último alcanzado. Un array vacío devuelve portrait como estado estático.
- [ ] Ejecutar node --test tests/scene-model.test.mjs; comprobar fallo por ausencia del módulo o exportaciones.
- [ ] Implementar las interfaces: coordenadas normalizadas x/y en [-1,1]; z sutil reproducible; prioridad de desprendimiento menor en hombros y periferia, mayor en el centro del rostro. Validar dimensiones y count antes de leer RGBA. Semilla fija 17; ninguna llamada a Math.random en el renderizado.
- [ ] Proyectar posiciones sobre el rectángulo de su espacio visual; la inclinación limitada nunca expone un giro lateral completo del rostro.
- [ ] Ejecutar node --test tests/scene-model.test.mjs; resultado: cero fallos. Commit: feat: add deterministic portrait and morph model.

### Task 3: Escena con profundidad y recuperación estática

**Files:** docs/assets/scene-renderer.mjs; tests/scene-renderer.test.mjs; docs/assets/style.css.
**Consumes:** funciones de scene-model, lienzo e imagen cargada.
**Produces:**
- createScene(canvas: HTMLCanvasElement, portrait: HTMLImageElement): Promise<Scene | null>.
- Scene.resize({slots: Record<Stage, Rect>, viewport: {width: number, height: number}, dpr: number, compact: boolean}): void.
- Rect: {left: number, top: number, width: number, height: number}, en coordenadas de documento.
- Scene.render({frame: Frame, scrollY: number, pointer: {x: number, y: number}, ambientTime: number}): void.
- Scene.dispose(): void. Todas las operaciones fallidas conservan la alternativa HTML.

- [ ] Escribir unavailable_context_preserves_fallback: createScene con canvas.getContext devolviendo null resuelve null. Añadir unloaded_portrait_preserves_fallback: una imagen con naturalWidth === 0 resuelve null antes de extraer píxeles. Comprobar estas salidas antes de crear buffers; basta un doble mínimo de Canvas e imagen, sin reproducir el navegador completo.
- [ ] Ejecutar node --test tests/scene-renderer.test.mjs; comprobar fallo inicial.
- [ ] Implementar preparación: crear buffers y conexiones una vez; capturar errores de lectura de imagen y devolver null con modelo vacío. Nunca ocultar la imagen HTML antes del primer dibujo correcto.
- [ ] Dibujar el retrato con bandas de imagen que se liberan primero desde hombros y bordes. Conservar el centro facial hasta el 45 % de la transición a branches. Combinarlo con filamentos de profundidad; no sustituir el retrato por una silueta irreconocible.
- [ ] Interpolar cada punto hacia su destino con el mismo índice. Reducir lazos distantes durante el morph; reagrupar por color/opacidad para evitar estilos nuevos por punto. No hacer lectura de píxeles ni regenerar objetivos por frame.
- [ ] Mantener el canvas limitado a los espacios visuales y sus transiciones; evitar trazos detrás de texto que reduzcan contraste. Las figuras finales deben corresponder a planos, flujo, volumen, trayectoria y JT.
- [ ] Ejecutar node --test tests/scene-model.test.mjs tests/scene-renderer.test.mjs. Resultado: cero fallos. Commit: feat: render portrait depth and filament morphs.

### Task 4: Conectar scroll, preferencias y ciclo de vida

**Files:** docs/assets/main.mjs; docs/index.html; docs/assets/style.css.
**Consumes:** createScene y sceneFrame; anclas/slots de tarea 1.
**Produces:** interacción completa y progresiva; se inicializa una vez con script type=module.

- [ ] Añadir en HTML un canvas aria-hidden sin tabindex y un control de pausa oculto por defecto. Solo mostrar el control cuando exista escena activa. La carga del módulo no bloquea contenido ni enlaces.
- [ ] Cargar y decodificar la imagen; crear la escena. Activar .scene-ready únicamente tras render correcto. Si algo falla o hay contextlost, quitar ese estado, liberar recursos, ocultar la pausa y conservar la página estática.
- [ ] Medir slots e hitos después de cargar la imagen y fuentes. Cada hito y se define como max(0, centro vertical del slot en el documento - alto de viewport / 2); normalizar en orden no decreciente. Forzar el primero a cero.
- [ ] Recalcular tras resize y cambio de orientación; guardar rectángulos absolutos. Aplicar scrollY en el dibujo sin medir todo el documento en cada frame.
- [ ] Usar listener pasivo de scroll y un solo requestAnimationFrame pendiente. Inicializar desde scrollY actual, incluido hash o restauración del navegador. No usar preventDefault sobre rueda, touchmove o enlaces.
- [ ] Implementar matchMedia para movimiento reducido y puntero grueso; escuchar cambios en vivo. Movimiento reducido conserva imagen y diagramas estáticos y cancela el bucle.
- [ ] Pausa accesible con aria-pressed: «Pausar movimiento» / «Reanudar movimiento». Congelar ambientTime y cursor; seguir dibujando a demanda cuando cambia scroll para conservar el morph reversible.
- [ ] Cancelar frames cuando la pestaña está oculta. Al volver, reconstruir desde scroll actual sin acumular tiempo oculto ni crear un segundo bucle.
- [ ] Comprobar en navegador: entrar directamente a #contact; refrescar a mitad de un proyecto; volver al inicio; avanzar y retroceder cada morph; cambiar orientación a mitad de transformación. Resultado: la misma posición conserva la misma forma.
- [ ] Comprobar con teclado la navegación, foco, salto al contenido, pausa y contacto; sin foco atrapado ni desplazamiento impuesto.
- [ ] Comprobar cambio de movimiento reducido en vivo, pausa seguida de ocultar/mostrar pestaña, JavaScript desactivado y recurso gráfico bloqueado mediante herramientas del navegador. Comprobar también que dispose admite dos llamadas seguidas. Resultado: contenido completo, imagen o alternativa accesible, sin errores no controlados ni pantalla vacía.
- [ ] Capturar entrada y estados intermedios en ambos tamaños; corregir saltos, pérdida de identidad o solapes antes del commit. Commit: feat: connect scroll-driven scene with accessible motion controls.

### Task 5: Validación final, rendimiento y entrega

**Files:** ajustes necesarios de implementación; README.md; docs/superpowers/verification/2026-10-17-portfolio.md.
**Consumes:** portfolio completo y criterios de aceptación de la especificación.
**Produces:** resultados verificables y vista local lista para revisión.

- [ ] Ejecutar node --test tests/scene-model.test.mjs tests/scene-renderer.test.mjs. Cero fallos; git diff --check sin errores.
- [ ] Revisar raíz y ruta anidada de publicación usando rutas relativas para CSS, módulos e imágenes. Inspeccionar consola y peticiones: ningún recurso local roto.
- [ ] Buscar residuos temáticos exclusivamente en archivos públicos de producto, excluyendo documentos históricos de superpowers. Revisar textos, clases e iconos; conservar referencias legítimas a VR.
- [ ] Medir diez segundos de recorrido a 1440 × 900 y 390 × 844 con las herramientas de rendimiento del navegador. Registrar navegador, equipo, media de frames y tareas de escena; distinguir carga inicial de recorrido interactivo.
- [ ] Si se incumplen 45/30 FPS o aparecen tareas de escena >100 ms, reducir primero conexiones dibujadas, después puntos y DPR; repetir solo la medición afectada. Mantener semilla, geometrías y navegación.
- [ ] Revisar además 360 px de ancho, zoom 200 %, alto contraste de enlaces/foco y dispositivo de puntero grueso. Comprobar que los proyectos y el contacto siguen siendo alcanzables.
- [ ] Revisar visualmente fidelidad del rostro y continuidad: hombros → ramas → planos → módulos → volumen → trayectoria → JT. No aceptar como equivalente una simple disolución.
- [ ] Guardar capturas finales en outputs y el registro de validación en el repositorio. Si no hubo teléfono físico, indicarlo expresamente; no presentar emulación como prueba física.
- [ ] Actualizar README con servidor local y comando de pruebas, explicación de diagramas y recursos originales. Revisar el diff completo; commit: docs: record portfolio validation and local workflow.
- [ ] Completar una revisión independiente de la rama según el método de ejecución elegido y resolver sus hallazgos relevantes. Presentar la vista local y los resultados al usuario. Si falta una comprobación, describir el límite concreto. No hacer push, despliegue ni merge como parte de este plan.

## Cobertura y revisión del plan

- Especificación 1–3 y contenido profesional: tarea 1.
- Retrato, profundidad y continuidad: tareas 2–4.
- Separación de responsabilidades y progreso reproducible: tareas 2–4.
- Scroll nativo, móvil, accesibilidad y recuperación: tareas 1, 3 y 4.
- Rendimiento, comprobaciones y entrega: tarea 5.
- Los cinco casos de Review Focus tienen comprobación asignada arriba.
- Las interfaces comparten Stage, Frame y Rect sin nombres alternativos.
- Las pruebas automáticas se concentran en lógica no trivial y recuperación; la composición visual se verifica en navegador.

## Handoff pendiente

El plan está listo para revisión del usuario. No se ha seleccionado aún el método de ejecución.

Recomendación: ejecución nativa en este chat, por la dependencia estrecha entre la geometría, el dibujo y los hitos de scroll. La alternativa con subagentes añade un implementador y revisión independientes por tarea. La implementación comienza después de revisar este plan y elegir el método.
