# Diseño: Quitar Memory, menú visual, zoom animado en Mapa, narración resaltada

## Contexto y objetivo

Con el juego ya desplegado y probado en real por un niño de ~4 años, el
usuario pide cuatro cambios basados en el uso real:

1. Quitar el modo Memory (no aporta al objetivo de aprender banderas/países
   de la forma que quiere el usuario en esta etapa).
2. Un menú principal mucho más visual — los botones actuales son texto plano
   sin pista de a dónde llevan, y el niño no lee.
3. Que el modo Mapa se vuelva más atractivo: un zoom animado desde el mundo
   completo hacia el país de la pregunta, para que el niño vaya aprendiendo
   la ubicación relativa de cada país mientras mira la animación.
4. En Bandera → País, como las 4 opciones son texto, resaltar visualmente el
   botón correspondiente mientras se narra su nombre en voz, para que el
   niño pueda seguir la narración sin leer.

## A. Eliminar Memory

Se elimina por completo: `src/components/MemoryGame.jsx`,
`src/components/MemoryGame.test.jsx`, `src/lib/memory.js`,
`src/lib/memory.test.js`. Se quita la entrada `memory` de `MainMenu`'s
`SCREENS` y el `screen === 'memory'` de `App.jsx`. Se eliminan las reglas
CSS `.memory-grid`/`.memory-card` (código muerto). `Album` y el resto de
modos no se ven afectados.

## B. Menú principal visual

`MainMenu`'s `SCREENS` gana dos campos por entrada: `icon` (un emoji) y
`color` (fondo del botón). Con Memory fuera, quedan 5 entradas:

| id | label | icon | color |
|---|---|---|---|
| flag-to-country | Bandera→País | 🏳️ | `#4361ee` (azul, ya existente) |
| country-to-flag | País→Bandera | 🚩 | `#2b9348` (verde) |
| map-game | Mapa | 🗺️ | `#f77f00` (naranja) |
| explore | Explorar mapa | 🧭 | `#7209b7` (morado) |
| album | Mi álbum | 📖 | `#e63946` (rojo/rosado) |

Layout: rejilla de 2 columnas a todo el ancho de pantalla (mismo patrón ya
usado para las opciones de País→Bandera), cada botón grande con el emoji en
tamaño destacado arriba y el texto debajo en tamaño menor. El texto se
mantiene (ayuda a un adulto o a un niño que ya vaya reconociendo letras),
pero el emoji + color es la señal principal para un niño de 4 años.

## C. Zoom animado en el modo Mapa

Al aparecer cada pregunta nueva (incluidas las que llegan tras un acierto):

1. El mapa se muestra en vista de mundo completo.
2. Aparece la bandera del país a buscar.
3. Empieza el audio ("Encuentra este país en el mapa" + nombre).
4. **A la vez**, el mapa empieza una animación de 4 segundos que centra y
   hace zoom hacia la región del país, dejando ver países vecinos (no un
   acercamiento tan cerrado que solo se vea el propio país).
5. Mientras dura la animación de zoom, los clics sobre el mapa quedan
   bloqueados; al terminar, se puede tocar normalmente.

### Enfoque técnico

- El centro del zoom se calcula con el centroide geográfico real del país
  (`d3-geo`'s `geoCentroid`, aplicado sobre la geometría GeoJSON que
  `react-simple-maps` ya nos da vía `Geographies`), no coordenadas escritas
  a mano — evita mantener una tabla de 44 países.
- El nivel de zoom usa un valor fijo razonable (no calculado por país a
  partir de sus límites geográficos), para evitar casos raros con países
  que cruzan el antimeridiano (ej. Nueva Zelanda) donde un cálculo
  automático de "cuánto zoom según el tamaño del país" puede salir mal. Un
  zoom fijo con el centroide correcto ya cumple razonablemente el objetivo
  de "ver el país y sus vecinos".
- La animación se hace vía transición CSS sobre el elemento que
  `react-simple-maps` mueve al cambiar `center`/`zoom` en `ZoomableGroup`
  (asumiendo que esos props son controlados y re-centran el mapa al
  cambiar, no solo un valor inicial). **Riesgo técnico**: esto se verifica
  contra el código fuente real de la librería instalada al implementar, no
  se asume sin comprobar. Si `center`/`zoom` resultan ser solo valores
  iniciales (no controlados), la animación con transición CSS simple no
  funcionará y haría falta un enfoque distinto (más complejo) o simplificar
  la función a un "salto" instantáneo sin animación suave — se reportará
  esto explícitamente si ocurre, en vez de forzar una implementación rota.

## D. Bandera→País: resaltar botón durante la narración

Se generaliza `useMultipleChoiceQuestion` (ya compartido por
`FlagToCountry` y `CountryToFlag`) para que, además de leer el array que
devuelve `announce(question)`, exponga qué índice de ese array se está
narrando en cada momento (`narratingIndex`), usando los eventos de inicio
de cada `SpeechSynthesisUtterance` en `src/lib/speech.js` (no una
estimación de tiempo, sino el evento real del navegador).

`FlagToCountry`'s `announce` devuelve `[pregunta, ...4 nombres]`, así que
`narratingIndex - 1` mapea directamente a la opción correspondiente
(`narratingIndex === 0` es la pregunta en sí, sin bandera destacable).
Mientras `narratingIndex` está dentro del rango de las 4 opciones, esa
opción se resalta visualmente (borde/fondo distinto, sin ser todavía verde
ni rojo — un tercer estado visual "narrando ahora"). Todos los botones
quedan deshabilitados hasta que `narratingIndex` termina (vuelve a `null`
tras la última opción), momento en el que se puede responder con
normalidad.

`CountryToFlag` recibe el mismo `narratingIndex` del hook (comparte el
hook) pero no lo usa — su `announce` devuelve solo el nombre del país
(índice único), sin opciones que resaltar; no cambia su comportamiento
actual.

`MapGame` no usa este hook y no se ve afectado por este cambio.

## Fuera de alcance

- No se rediseña el modo País→Bandera, Mapa (más allá del zoom) ni el
  Álbum en este ciclo, salvo lo ya descrito.
- No se ajusta el zoom por tamaño real de cada país (ver riesgo técnico en
  la sección C) — zoom fijo con centroide real.
- No se resuelve aquí si el enfoque de animación CSS no funciona con la
  librería del mapa; se reporta como bloqueo si ocurre, en vez de
  improvisar una solución no planeada.

## Riesgos / dependencias a validar en implementación

- Confirmar si `ZoomableGroup`'s `center`/`zoom` son props controlados
  (re-centran al cambiar) antes de construir la animación sobre esa
  asunción.
- Confirmar el nombre de clase CSS que `react-simple-maps` aplica al
  elemento que se transforma, para poder aplicarle la transición.
- Verificar que los eventos `onstart` de `SpeechSynthesisUtterance`
  disparan de forma fiable en el navegador real del dispositivo del niño
  (en `jsdom` no existen, así que esto requiere la misma verificación
  manual en navegador ya pendiente de ciclos anteriores).
