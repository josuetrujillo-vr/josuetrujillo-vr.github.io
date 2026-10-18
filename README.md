# Portfolio de Josue Trujillo

Sitio estático en español: «Conecto código, procesos y personas». GitHub Pages
publica el directorio `docs/`; no requiere compilación ni dependencias de producción.

## Vista local

Con Node.js 22 o posterior, desde la raíz del repositorio:

```powershell
node tools/serve.cjs
```

Abrir <http://127.0.0.1:4177/>. Para otro puerto: `node tools/serve.cjs 8080`.
Detener con Ctrl+C. El servidor usa la biblioteca estándar, escucha solo en
127.0.0.1, limita los archivos a `docs/` y declara los tipos MIME de imágenes y
módulos. Evitar abrir el HTML con `file://`: los módulos necesitan HTTP.

## Comprobaciones

```powershell
node --test tests/scene-model.test.mjs tests/scene-renderer.test.mjs
git diff --check
```

Las pruebas cubren geometría determinista, hitos y recuperación de la escena.
`tests/browser-check.cjs` conserva las comprobaciones opcionales de interacción
para un entorno que ya disponga de Playwright y Chrome. Con el servidor activo:

```powershell
$env:PLAYWRIGHT_MODULE='ruta/al/modulo/playwright'
$env:BROWSER_EXECUTABLE='ruta/al/chrome.exe'
$env:BASE_URL='http://127.0.0.1:4177/'
node tests/browser-check.cjs
```

El [registro de validación](docs/superpowers/verification/2026-10-17-portfolio.md)
describe las mediciones, las capturas y sus límites. La emulación móvil no
sustituye la revisión en un teléfono físico.

## Contenido y recursos

- `docs/index.html` contiene los proyectos, trayectoria, educación y contactos.
- `docs/assets/style.css` define la composición adaptable y el foco visible.
- `scene-model.mjs` prepara destinos estables; `scene-renderer.mjs` los dibuja;
  `main.mjs` conecta el scroll nativo y las preferencias de movimiento.
- Los diagramas de ramas, web, sistemas, VR, trayectoria y JT son composiciones
  conceptuales, no capturas de aplicaciones ni demostraciones de proyectos.
- `portrait-original.png` conserva exactamente el retrato aportado.
  `portrait.webp` es su conversión local optimizada, de 1254 × 1254 píxeles,
  sin recorte ni alteración del contenido. El PNG original se conserva como fuente.
- Inter se carga desde Google Fonts y dispone de `system-ui` como alternativa.
  Los iconos esenciales son SVG inline, sin biblioteca externa.

El HTML y sus diagramas funcionan sin JavaScript. Movimiento reducido, errores
de imagen o falta de Canvas conservan la presentación estática. El control de
pausa aparece cuando la escena está disponible y permite seguir recorriendo el
contenido con scroll nativo. No se publica automáticamente desde este flujo.
