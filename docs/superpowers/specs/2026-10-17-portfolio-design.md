# Portfolio — De persona a sistema

Fecha: 2026-10-17
Proyecto: josuetrujillo-vr.github.io
Estado: especificación aprobada por el usuario en este chat el 2026-10-17.
Frase aprobada: «Conecto código, procesos y personas».

## 1. Propósito y acuerdos

Presentar a Josue Trujillo como desarrollador versátil: interfaces web, sistemas de negocio, automatización y experiencias interactivas. El visitante debe reconocer quién es, entender qué construye, revisar trabajos reales y encontrar cómo contactarlo.

El usuario eligió «De persona a sistema» y aprobó el recorrido: presentación con retrato, transformación en conexiones, proyectos, trayectoria y contacto. La imagen adjunta será el origen visual de la experiencia. Eliminar la temática de Genshin Impact, tanto en los textos como en la decoración y los nombres internos ligados al tema.

La animación debe expresar continuidad: los filamentos del retrato se reorganizan para introducir contenido. No basta con desvanecer la fotografía y mostrar secciones sin relación visual.

## 2. Dirección visual

Fondo negro tinta, texto blanco cálido, grises neutros y naranja puntual para actividad, enlaces destacados y estados. Los colores son una propuesta de diseño, sujetos a la revisión de este documento.

Tipografía sans serif de presencia fuerte para nombre y títulos; texto legible para explicaciones; monoespaciada solo en pequeñas anotaciones técnicas. Sustituir Cinzel y Marcellus. No introducir terminales ficticias, indicadores inventados ni ornamentación de videojuego.

Usar composiciones asimétricas, espacio vacío y proyectos de tamaños distintos. Los casos principales deben tener imágenes y estructura propia, evitando una cuadrícula repetida de tarjetas con etiquetas.

La imagen es un retrato compuesto por trazos blancos sobre negro. Su silueta debe integrarse al fondo sin marco visible.

## 3. Contenido y recorrido

### 3.1 Presentación

En escritorio, nombre y texto a la izquierda; retrato grande a la derecha. El retrato no invade la zona de lectura.

Nombre visible: Josue Trujillo.
Frase principal exacta: «Conecto código, procesos y personas».
Descripción propuesta: «Desarrollo software, automatizo procesos y exploro experiencias interactivas».
Acciones: «Explorar proyectos» y «Contactar».
El nombre completo, Josue Trujillo Zenon, permanece en los metadatos y el cierre.

Navegación breve: Proyectos, Trayectoria y Contacto. Los enlaces deben funcionar directamente, también sin animaciones.

### 3.2 Del retrato a las conexiones

El retrato comienza completo y reconocible. Al avanzar el scroll se desprenden primero los filamentos exteriores de los hombros. El rostro conserva su identidad durante el comienzo de la transición.

Los trazos desprendidos se extienden hacia abajo, adquieren destinos visibles y forman tres ramificaciones: Interfaces, Sistemas y Experiencias. Después se incorpora el resto del retrato.

Estas ramificaciones son una introducción a los proyectos, no un menú que obligue a descubrir gestos. El contenido aparece en orden de lectura normal.

El progreso depende de la posición del scroll. Detener el scroll detiene la transformación; retroceder reconstruye los estados anteriores. El movimiento ambiental y la reacción al cursor se pueden detener de forma independiente.

### 3.3 Proyectos

Primer caso: web universitaria. Los hilos forman planos que se separan y presentan una captura real de la interfaz. Contenido: plataforma, componentes, colaboración y aportación de Josue.

Segundo caso: Odoo e integración de ingeniería. Las conexiones forman un flujo de módulos. Contenido: procesos de negocio, automatización, PLM y relación con KiCad, según la información ya presente en el portfolio.

Tercer caso: realidad virtual. Los filamentos forman un volumen espacial que introduce el proyecto de A-Frame/WebVR y su interacción.

El sistema de gestión jurídica del DIF se conserva como caso adicional visible, con su información actual. Otros trabajos web se agrupan en una sección secundaria breve.

Cada caso principal incluye problema, contribución personal, resultado y tecnologías usadas. Usar capturas reales si están disponibles; en su ausencia, mostrar un diagrama identificable como representación del proyecto. No fabricar capturas, testimonios, métricas ni enlaces a demos.

Los resultados numéricos existentes del DIF se conservan vinculados a ese proyecto; no se atribuyen a otros trabajos.

Cada transición debe permitir percibir que la figura nueva nace de la anterior. Los títulos, párrafos, enlaces y capturas se presentan como contenido estable y accesible, independiente de los trazos animados.

### 3.4 Trayectoria y capacidades

Las líneas se convierten en un recorrido que conecta la experiencia profesional. Priorizar las funciones de desarrollo; conservar el resto de la trayectoria en entradas más compactas.

Las tecnologías aparecen asociadas a los proyectos y la experiencia. Puede existir un resumen breve por área, sin repetir la lista completa en cada sección.

Conservar educación y certificaciones en una composición secundaria legible. El rediseño no debe borrar experiencia ni inventar una especialización única.

### 3.5 Contacto

Los últimos filamentos dibujan JT y acompañan la invitación a conversar. Mantener correo, teléfono y GitHub existentes. No añadir formularios o servicios externos.

Texto propuesto: «¿Qué podemos construir juntos?».
La información de contacto debe estar disponible sin terminar toda la animación.

El idioma propuesto para la página es español, alineado con la frase aprobada. Adaptar fielmente los textos profesionales existentes; no incluir un selector de idiomas en esta versión.

## 4. Tratamiento del retrato y profundidad

El PNG adjunto es la referencia visual y debe conservarse como recurso original local del sitio durante la implementación, con una versión optimizada para la web.

La primera versión utiliza profundidad construida a partir del retrato: puntos y segmentos distribuidos en capas espaciales, perspectiva y desplazamientos sutiles. El objetivo es conservar el aspecto de filamentos y la identidad de la cara.

No se promete una reconstrucción anatómica ni una rotación libre del rostro. La inclinación con el cursor es leve; no debe descubrir zonas inexistentes de la imagen ni deformar ojos, boca o proporciones.

El paso del retrato original a su representación animada debe ser continuo y no producir un cambio brusco de aspecto. Si la extracción de trazos pierde fidelidad, el PNG conserva la cara y la capa animada aporta profundidad y desprendimiento gradual. Este comportamiento es parte del diseño previsto.

Las formas de proyectos se construyen como composiciones de filamentos. Las capturas reales se revelan dentro o junto a esas composiciones.

## 5. Organización técnica y flujo

Mantener la publicación estática de GitHub Pages y el directorio docs como raíz pública. La estructura actual es HTML, CSS y JavaScript; este rediseño no requiere migrar el contenido a un framework.

Separar cuatro responsabilidades:

- Documento: contenido semántico, navegación, proyectos, trayectoria y contacto.
- Presentación: tipografía, composición, color, adaptación de pantalla y foco.
- Escena visual: retrato, segmentos, profundidad y estados de las formas.
- Coordinación de movimiento: convertir scroll e interacción en progreso de escena, sin controlar la disponibilidad del contenido.

Una escena visual compartida mantiene la continuidad entre capítulos. Recibe progreso normalizado, tamaño disponible y preferencias de movimiento; no decide qué texto se muestra ni administra los enlaces.

Las posiciones de las secciones determinan el progreso. El tamaño disponible y los cambios de orientación recalculan los destinos sin reiniciar arbitrariamente el recorrido.

Las formas tienen destinos estables: la misma posición del scroll produce la misma composición. Evitar regenerar posiciones aleatorias mientras el visitante navega.

La escena no debe renderizar párrafos ni botones como píxeles. La elección del motor gráfico y las dependencias concretas corresponde al plan de implementación y deberá respetar estos límites.

## 6. Interacción, móvil y accesibilidad

Usar scroll nativo. No interceptar la rueda ni imponer navegación por pantallas. No exigir arrastrar, hacer clic sobre partículas ni completar una introducción.

En móvil, colocar primero nombre y frase y después el retrato. Reducir la cantidad de trazos, simplificar las formas y desactivar la respuesta al cursor. Los proyectos siguen una sola columna.

Limitar cualquier tramo visual fijado a lo necesario para entender la transición; evitar recorridos largos sin contenido nuevo. Los enlaces de navegación permiten saltar capítulos y llegar al contacto.

La animación ambiental del retrato y su respuesta al cursor se detienen con un control accesible de pausa. Las transformaciones ligadas al scroll continúan dependiendo exclusivamente de la navegación del usuario.

Con preferencia de movimiento reducido, mostrar la imagen estática y composiciones de capítulo sin desarme, desplazamiento ambiental ni inclinación. Todo el contenido conserva su orden y sus enlaces.

Mantener contraste suficiente, foco visible, títulos jerárquicos y navegación por teclado. El retrato tiene alternativa textual; la escena y sus partículas son decorativas para lectores de pantalla.

## 7. Rendimiento y recuperación

Mostrar primero texto y retrato estático; la escena se activa después sin bloquear la lectura ni desplazar el contenido.

Ajustar la cantidad de partículas y la resolución de dibujo al dispositivo. Evitar cálculos pesados en cada evento de scroll y detener el renderizado cuando la pestaña esté oculta o la escena no aporte movimiento.

Referencia de validación: Chromium en el equipo de desarrollo, con ventanas de 1440 × 900 y 390 × 844 píxeles; la segunda comprueba la composición móvil y no sustituye una prueba en un teléfono físico. En cada tamaño, recorrer las transformaciones durante diez segundos y buscar una media mínima de 45 fotogramas por segundo en escritorio y 30 en la vista móvil, sin tareas de la escena superiores a 100 ms. Si el coste impide alcanzar esos objetivos, reducir calidad antes de eliminar contenido o alterar el scroll nativo. Registrar si falta una validación adicional en un teléfono físico.

Sin JavaScript, con recursos gráficos no disponibles o tras perder el contexto gráfico, mostrar retrato estático y todo el contenido. Ninguna sección queda oculta esperando una clase de animación.

## 8. Alcance y exclusiones de esta versión

Incluye rediseño visual, incorporación del retrato, transformaciones por scroll, reorganización del contenido existente, adaptación móvil y accesibilidad.

No incluye un editor, backend, analítica nueva, formulario externo, reconstrucción facial completa, modelo 3D para rotación libre, contenido profesional inventado ni publicación automática.

## 9. Criterios de aceptación

1. El inicio muestra nombre a la izquierda y retrato a la derecha en escritorio, con la frase aprobada exacta.
2. El rostro resulta reconocible antes del primer scroll y mantiene la continuidad visual durante el desarme.
3. Los filamentos se convierten en conexiones y figuras de proyecto; no se limitan a desaparecer.
4. Web, sistemas y VR tienen presencia explícita y casos comprensibles.
5. El DIF, trayectoria, educación, certificaciones y contactos conservan su información.
6. No permanecen referencias temáticas a Genshin, Frostmoon, quests, traveler, artifacts, lore o constellations.
7. El scroll inverso reconstruye las composiciones sin saltos ni posiciones aleatorias nuevas.
8. Los proyectos y contactos son accesibles por enlaces, teclado y lectura normal.
9. Móvil, movimiento reducido y ausencia de animación conservan una experiencia completa.
10. No aparecen errores de consola propios de la página ni recursos locales rotos durante el recorrido.

La verificación de implementación incluirá revisión visual de entrada, estados intermedios, proyectos y cierre; recorrido hacia adelante y atrás; pantallas de escritorio y móvil; navegación por teclado; movimiento reducido y recuperación sin escena.

## 10. Siguiente etapa

La especificación fue aprobada por el usuario. La siguiente etapa es revisar el plan de implementación, que concreta tareas, recursos, decisiones de renderizado y comprobaciones, y seleccionar su método de ejecución antes de implementar.
