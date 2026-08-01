# Diseño: Modo fácil por continente, feedback visual/voz, y ajustes de interacción

## Contexto y objetivo

Tras el uso real del juego "Banderas del Mundial" (v1, ya desplegado), el usuario
pide tres mejoras basadas en cómo su hijo (5-7 años, apenas lee) interactúa con
la app en el móvil/tablet:

1. Una forma más sencilla de explorar el mapa mundial: por continente, en vez
   de enfrentarse al mundo entero de golpe.
2. Feedback mucho más visual (color + icono) y con voz, ya que el niño no
   puede apoyarse en el texto para saber si acertó o cómo seguir.
3. Un arreglo de un bug real encontrado en móvil: en País → Bandera las 4
   banderas de las opciones son tan grandes que hay que hacer scroll para
   llegar al botón "Siguiente".

Durante el diseño surgieron dos decisiones de producto importantes que
cambian el comportamiento existente de los 3 modos de pregunta (no solo el
que motivó la queja original):

- Se sustituye el botón "Siguiente" por un avance automático tras responder.
- Se sustituye el comportamiento de "revelar la respuesta correcta al
  fallar" (usado en v1 en los 3 modos, y además ampliado en el modo Mapa
  con un resaltado visual del país correcto) por un modelo de
  **reintentar hasta acertar, sin revelar nunca la respuesta**. Esto
  **revierte** el resaltado-al-fallar del modo Mapa añadido en el ciclo de
  revisión final de la v1.

## Alcance

Afecta a: `FlagToCountry`, `CountryToFlag`, `MapGame`, `ExploreMap`,
`paises.js`, `FlagIcon`, y añade componentes/datos nuevos. No afecta a
`MemoryGame` ni `Album` (fuera de alcance, confirmado con el usuario).

## A. Modo fácil por continente (Explorar mapa)

### Datos

Cada una de las 49 entradas de `paises.js` gana un campo `continent`, uno de:
`america`, `europa`, `africa`, `asia`, `oceania`. La agrupación sigue la
confederación de fútbol de cada equipo (consistente con el resto del juego):

- **América** (12): Canadá, México, Estados Unidos, Argentina, Brasil,
  Ecuador, Paraguay, Uruguay, Colombia, Panamá, Curazao, Haití.
- **Europa** (17): Inglaterra, Francia, Croacia, Portugal, Noruega,
  Alemania, Países Bajos, Suiza, Escocia, España, Austria, Bélgica, Bosnia y
  Herzegovina, Suecia, Turquía, Chequia, Italia.
- **África** (10): Marruecos, Túnez, Egipto, Argelia, Ghana, Cabo Verde,
  Senegal, Sudáfrica, Costa de Marfil, RD Congo.
- **Asia** (8): Japón, Irán, Uzbekistán, Jordania, Corea del Sur, Catar,
  Arabia Saudí, Irak.
- **Oceanía** (2): Nueva Zelanda, Australia.

(12+17+10+8+2 = 49, cuadra con el total del dataset.)

### Comportamiento

Al entrar en "Explorar mapa", en vez del mapa mundial directo, se muestra
una pantalla con 6 botones grandes: los 5 continentes (nombre en español) y
"Ver el mundo entero". Al elegir un continente:

- El mapa se centra y hace zoom sobre esa región usando un centro/zoom
  aproximado predefinido por continente (no se ocultan ni filtran los
  países de otros continentes del topojson — es una cuestión de encuadre,
  no de datos — para no requerir clasificar los ~130 países del mundo que
  no están en nuestro dataset de 49).
- El pan/zoom libre (`ZoomableGroup`) sigue disponible dentro de esa vista.
- Un botón "◀ Elegir otro continente" (distinto del "◀ Menú" ya existente)
  vuelve a la pantalla de botones.

Al elegir "Ver el mundo entero" se comporta exactamente igual que la v1
actual (mapa completo, zoom libre desde el centro por defecto).

## B. Interacción rediseñada en los 3 modos de pregunta

Aplica igual a `FlagToCountry`, `CountryToFlag` y `MapGame`. Sustituye el
modelo v1 (bloqueo tras el primer clic + botón "Siguiente" + revelar
respuesta al fallar) por:

**Al tocar una opción incorrecta** (o un país incorrecto en el mapa):
- Esa opción se marca visualmente en rojo (borde/fondo rojo) y queda
  deshabilitada — no se puede volver a tocar. En el modo Mapa no hay
  "opciones" discretas, así que no se deshabilita nada permanente: el país
  tocado recibe un parpadeo/resaltado rojo breve y sigue siendo tocable de
  nuevo (fallar dos veces el mismo país simplemente repite el feedback).
- Se muestra un bloque de feedback: icono de cruz roja grande + texto
  "Prueba con otra" (sin mencionar el país). Se lee en voz alta.
- La pregunta **sigue abierta**: el niño puede tocar otra opción o punto del
  mapa inmediatamente. No hay avance automático tras un fallo.
- **Nunca se revela cuál era la respuesta correcta** — ni en texto, ni
  resaltando el país en el mapa. Esto revierte el resaltado-al-fallar
  añadido al modo Mapa en el ciclo de revisión final de la v1 (se elimina
  ese código).

**Al tocar la opción correcta:**
- Esa opción se marca en verde. Se dispara `unlockCountry` (igual que en
  v1).
- Se muestra el bloque de feedback: icono de check verde grande + texto
  "¡Genial! Es España". Se lee en voz alta.
- Tras una pausa fija de ~1800ms, se carga automáticamente una **pregunta
  nueva** (no la misma). No hay botón que tocar.

**Se elimina el botón "Siguiente"** de los 3 componentes.

### Componente compartido

Se extrae un componente `AnswerFeedback` (icono + texto + color), usado por
los 3 modos, para no triplicar el marcado. Sustituye a los bloques
`feedback feedback--correct|--incorrect` que cada componente implementaba
por separado en v1.

## C. Voz (Web Speech API)

Se generaliza el patrón que `CountryToFlag` ya usa en v1 (con guardas para
navegadores sin `speechSynthesis`, nunca lanza excepción):

- **Bandera → País**: al cargar la pregunta, se lee en cola "¿Qué país es
  esta bandera?" seguido de los 4 nombres de opción ("España. Francia.
  Italia. Alemania."). Botón 🔊 visible para repetir la lectura completa a
  petición.
- **País → Bandera**: se mantiene la lectura del nombre del país (v1). Se
  añade el mismo botón 🔊 por consistencia con los otros 2 modos.
- **Mapa**: se lee "Encuentra este país en el mapa" + el nombre del país.
  Botón 🔊 para repetir.
- En los 3 modos, el feedback de acierto/fallo ("¡Genial! Es España" /
  "Prueba con otra") también se lee en voz alta al aparecer.

No se sincroniza la duración de la pausa de 1800ms (acierto) con la
duración real del audio — es una aproximación deliberada, no crítica.

## D. Arreglo de tamaño de banderas en móvil (País → Bandera)

`FlagIcon` gana un tercer tamaño (`size="medium"`), pensado para 4 banderas
en una rejilla 2×2 sin necesitar scroll en un viewport de móvil/tablet
(más pequeño que el `large` actual de 220×147, usado hasta ahora también
para las opciones). `CountryToFlag` pasa sus 4 botones de opción a
`size="medium"`; el `large` se reserva para banderas protagonistas
individuales (la pregunta en `FlagToCountry` y `MapGame`).

## Fuera de alcance (confirmado con el usuario)

- `MemoryGame` y `Album`: sin cambios.
- Filtrar/ocultar países de otros continentes en el topojson del modo
  fácil (solo se reencuadra la vista).
- Sincronizar la pausa de auto-avance con la duración real del audio.

## Riesgos / dependencias a validar en implementación

- El modelo de "reintentar hasta acertar" en `MapGame` significa que, a
  diferencia de los otros 2 modos (4 opciones, garantía de acertar al
  tercer intento como máximo), un país pequeño mal delimitado en el mapa
  podría ser difícil de acertar por precisión táctil, no por
  desconocimiento — mismo riesgo ya conocido de v1 (verificación manual en
  navegador pendiente), no se agrava ni se resuelve aquí.
- Los centros/zoom por continente son aproximados (no se calculan a partir
  de las geometrías reales); confirmar visualmente en implementación que
  cada continente queda razonablemente encuadrado.
