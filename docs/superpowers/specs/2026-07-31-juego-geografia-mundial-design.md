# Diseño: Juego de geografía "Banderas del Mundial"

## Contexto y objetivo

Juego web para que un niño de 5-7 años aprenda países y banderas, motivado por
la colección de cromos Panini del Mundial de fútbol 2026. El juego usa los 48
países clasificados al Mundial 2026 más Italia (49 en total, por petición
explícita aunque Italia no haya clasificado), y refuerza la mecánica de
colección con un álbum de cromos digital.

## Público y contexto de uso

- Niño de 5-7 años, lectura básica: interfaz mayormente visual, botones
  grandes, poco texto, feedback siempre positivo (nunca punitivo al fallar).
- Se juega en tablet/móvil vía navegador (diseño responsive/táctil).
- Español como único idioma de la interfaz.

## Arquitectura

- App de una sola página (SPA) con **React + Vite**, sin backend ni base de
  datos.
- Menú principal con 5 secciones accesibles en todo momento: los 4 modos de
  juego, el mapa de exploración, y una pestaña "Mi álbum".
- Cada modo de juego es un componente independiente; comparten el dataset de
  países y un módulo común de progreso (lectura/escritura en `localStorage`).
- Despliegue: repo en GitHub, deploy automático en Vercel en cada push a
  `main`. Sin login, sin sincronización entre dispositivos.

## Datos

- Archivo `src/data/paises.json` con 49 entradas: nombre en español, código
  ISO 3166-1 alpha-2/alpha-3, y referencia a la bandera SVG del paquete
  `flag-icons` (empaquetado localmente, sin llamadas a CDN externo en tiempo
  de ejecución).
- La lista de los 48 clasificados al Mundial 2026 debe verificarse contra una
  fuente oficial/actualizada antes de escribir el JSON, ya que el
  conocimiento del asistente no cubre el cierre completo de la clasificación
  (repechajes de 2026). Se añade Italia como entrada 49 aparte del criterio
  de clasificación.
- El mapa mundial usa datos TopoJSON estándar (world-atlas) vía
  `react-simple-maps`, que ya incluyen todos los países del mundo (no solo
  los 49) para la sección de exploración.

## Modos de juego

Los 4 modos son seleccionables libremente desde el menú principal, sin orden
obligatorio. Reglas comunes:

- Feedback siempre positivo: al fallar, se muestra la respuesta correcta con
  un mensaje de ánimo (nunca "perdiste" ni cuenta atrás de vidas).
- Cada acierto desbloquea el cromo de ese país en el álbum si no estaba ya
  desbloqueado.
- Las opciones incorrectas de cada pregunta se eligen al azar entre el resto
  de los 49 países.

1. **Bandera → País**: se muestra una bandera grande; 4 botones de texto con
   nombres de país (uno correcto, español).
2. **País → Bandera**: se muestra el nombre del país (con lectura en voz alta
   vía Web Speech API si el navegador la soporta); 4 banderas grandes para
   elegir.
3. **Mapa**: se muestra bandera o nombre de un país; el niño toca el país
   correcto sobre un mapa interactivo. Si falla varias veces seguidas en la
   misma pregunta, se resalta visualmente la zona correcta como ayuda.
4. **Memory (parejas)**: cuadrícula de cartas boca abajo, cada país
   representado por dos cartas (una con su bandera, otra con su nombre); el
   niño busca las parejas. El tamaño de la cuadrícula empieza pequeño (pocas
   parejas) y no es configurable en v1.

## Álbum de cromos

- Cuadrícula tipo álbum Panini con las 49 casillas fijas (mismo orden
  siempre).
- Casillas no desbloqueadas: silueta gris con interrogante.
- Casillas desbloqueadas: bandera a color + nombre del país.
- Contador de progreso ("38/49 cromos") visible en la parte superior de la
  pestaña.
- El progreso se guarda en `localStorage` del dispositivo; no hay
  sincronización entre dispositivos ni cuenta de usuario.

## Mapa de exploración

- Sección separada ("Explorar mapa") con `react-simple-maps`: zoom y pan
  libres sobre el mapa mundial completo.
- Al tocar uno de los 49 países del Mundial: se muestra nombre, bandera, y si
  ya está desbloqueado en el álbum.
- Al tocar cualquier otro país del mundo (no Mundial): se muestra solo el
  nombre (dato propio del TopoJSON), sin bandera ni relación con el álbum.
- Esta sección no otorga cromos ni cuenta como acierto/fallo; es solo
  exploración libre.

## Persistencia y despliegue

- Todo el estado (álbum desbloqueado, progreso) en `localStorage`, sin
  backend.
- Repo Git en GitHub; deploy estático automático en Vercel.
- No se usa Supabase en esta v1 (se descartó explícitamente a favor de
  `localStorage` por simplicidad, al ser un solo dispositivo).

## Fuera de alcance (v1)

Capitales, continentes/regiones, sonidos o música, modo multijugador,
sincronización de progreso entre dispositivos, login de usuario,
configuración de dificultad/tamaño de cuadrícula en Memory.

## Riesgos / dependencias a validar en implementación

- Verificar la lista exacta y oficial de los 48 equipos clasificados al
  Mundial 2026 antes de generar `paises.json` (dato posterior al corte de
  conocimiento del asistente).
- Confirmar que `react-simple-maps` + world-atlas funcionan bien en táctil
  (pinch-zoom) en tablets, no solo con ratón.
- Confirmar disponibilidad de banderas SVG para los 49 países en el paquete
  `flag-icons`.
