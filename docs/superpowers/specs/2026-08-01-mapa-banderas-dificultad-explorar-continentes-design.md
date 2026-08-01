# Diseño: Banderas en el mapa, dificultad progresiva, y Explorar mapa mejorado

## Contexto y objetivo

Cuarta ronda de mejoras basada en el uso real del juego. Dos áreas:

1. **Modo Mapa**: hacerlo más motivador visualmente (ver cómo se va
   "rellenando" el mapa con banderas a medida que acierta) y pedagógicamente
   mejor calibrado (empezar por países conocidos, subir dificultad poco a
   poco).
2. **Explorar mapa**: el selector de continente actual es texto plano (el
   mismo problema que tenía el menú principal antes de su rediseño), el
   encuadre por continente es aproximado a mano y a veces deja ver trozos de
   continentes vecinos, y falta una forma más "ilustrada" de reconocer
   países al explorar sin tener que tocarlos uno a uno.

## A. Modo Mapa: banderas emoji sobre el mapa

### Qué banderas y dónde

Se usan banderas emoji Unicode (las mismas que renderiza WhatsApp/el
teclado del móvil — más pequeñas y "amigables" que las banderas SVG
realistas ya usadas en el resto del juego) **solo** como marcador
decorativo sobre el mapa del modo Mapa. El resto del juego (Bandera→País,
País→Bandera, Álbum, la bandera grande a adivinar en el propio modo Mapa)
sigue usando las banderas SVG actuales sin cambios.

Fórmula técnica: un emoji de bandera de 2 letras se construye combinando
los dos "regional indicator symbols" Unicode correspondientes a las letras
del código ISO (ej. `ES` → 🇪🇸). Inglaterra y Escocia no tienen un emoji de
bandera de 2 letras fiable multiplataforma (los emoji de banderas
regionales con "tag sequence" se ven mal o como bandera negra genérica en
muchos Android) — para esas dos entradas se usa 🇬🇧 (Reino Unido) en su
lugar, una pequeña imprecisión deliberada a cambio de que se vea bien
garantizado en el móvil del niño.

### Cuándo aparecen y cuánto duran

Al acertar un país en el modo Mapa, su bandera emoji se coloca sobre su
ubicación real en el mapa (usando el mismo centroide ya calculado para el
zoom) y permanece visible **mientras dure la sesión actual** de esa
pantalla. Al salir del modo Mapa y volver a entrar, empieza vacío de nuevo
— no se guarda entre visitas, y es independiente del progreso guardado en
el álbum (un país puede estar ya en el álbum por haberlo acertado en otro
modo y aun así no tener bandera puesta en el mapa hasta acertarlo *en esta
sesión de Mapa*).

Los marcadores son puramente decorativos: no se pueden tocar ni interfieren
con tocar el país subyacente para responder preguntas futuras.

## B. Modo Mapa: dificultad progresiva

Los 47 países del mapa (49 menos Cabo Verde y Curazao, que no tienen
geometría en el atlas) se clasifican en 3 niveles según lo conocidos que
suelen ser para un niño:

- **Fácil** (12): España, Francia, Alemania, Italia, Brasil, Argentina,
  Estados Unidos, México, Inglaterra, Portugal, Japón, Canadá.
- **Medio** (21): Países Bajos, Bélgica, Suiza, Austria, Colombia, Uruguay,
  Ecuador, Marruecos, Egipto, Arabia Saudí, Catar, Corea del Sur,
  Australia, Escocia, Turquía, Sudáfrica, Senegal, Ghana, Croacia,
  Noruega, Suecia.
- **Difícil** (14): Paraguay, Panamá, Haití, Túnez, Argelia, Costa de
  Marfil, Bosnia y Herzegovina, Chequia, RD Congo, Irán, Irak, Jordania,
  Uzbekistán, Nueva Zelanda.

(Esta clasificación es un juicio razonable, no una verdad objetiva — si al
jugar se nota que algún país está mal clasificado, se ajusta después.)

Al elegir cada pregunta nueva, se sortea primero un nivel de dificultad con
una probabilidad que depende de cuántos aciertos lleva el niño **en esa
sesión de Mapa**: empieza muy sesgada a fácil (70% fácil / 25% medio / 5%
difícil) y se va igualando lineal­mente hasta quedar totalmente uniforme
(33%/33%/33%) tras 10 aciertos. Dentro del nivel elegido, el país concreto
se sortea al azar entre los de ese nivel. Nunca es un orden fijo idéntico
cada vez — hay variedad desde el principio, tal como se pidió.

## C. Explorar mapa: selector de continente visual

Se aplica el mismo lenguaje visual ya usado en el rediseño del menú
principal: en vez de botones de texto plano, tarjetas grandes con emoji +
color por continente (ej. 🌎 América, 🏰 Europa, 🦁 África, 🏯 Asia, 🐨
Oceanía — íconos exactos a decidir en el plan) más la tarjeta "Ver el mundo
entero".

## D. Explorar mapa: encuadre por continente calculado con datos reales

En vez de las coordenadas de centro/zoom aproximadas a mano que tiene hoy
`continents.js` (que a veces dejan ver trozos de continentes vecinos), el
centro y el zoom de cada continente se calculan a partir de los límites
geográficos reales de los países de ese continente en nuestro dataset
(usando las mismas herramientas ya usadas para el centroide de país en el
modo Mapa). El centro pasa a ser exacto (el punto medio real de las
fronteras del continente); el nivel de zoom sigue siendo una fórmula
aproximada basada en cuánto abarca ese continente en grados — mejor punto
de partida que las cifras actuales, pero su ajuste fino sigue necesitando
la comprobación visual manual ya pendiente de rondas anteriores.

## E. Explorar mapa: banderas emoji que aparecen al hacer zoom

A medida que el usuario hace zoom (con los dedos o al elegir un
continente), las banderas emoji de los países que caben en la pantalla en
ese momento van apareciendo sobre el mapa — igual que en el modo Mapa,
puramente ilustrativo, sin necesidad de tocar el país. Se calcula qué
países están dentro del área visible actual y se muestran sus banderas
mientras el zoom sea igual o mayor que un umbral mínimo (por debajo de ese
umbral, con el mundo entero visible, sería demasiado denso mostrar 49
banderas a la vez y no se muestran). El panel de información al tocar un
país (nombre, bandera SVG grande, si está en el álbum) se mantiene
exactamente igual que ahora — esto es un elemento visual añadido, no un
reemplazo de esa función.

## Fuera de alcance

- No se cambian las banderas SVG del resto del juego (solo estos dos
  puntos concretos usan emoji).
- No se guarda el progreso de "banderas puestas en el mapa" entre visitas
  al modo Mapa.
- No se reclasifican los niveles de dificultad de forma dinámica según el
  desempeño real del niño (por ahora es una clasificación fija).
- No se implementa un "zoom exacto a un país" al tocarlo en Explorar mapa
  (eso se descartó — el punto B de la ronda anterior era sobre encuadre de
  *continente*, no de país individual).

## Riesgos / dependencias a validar en implementación

- El emoji de bandera renderizado depende de la fuente de emoji del
  dispositivo/navegador — confirmar visualmente en el móvil real del niño
  que se ven como banderitas reconocibles y no como cuadros/código roto.
- La fórmula de zoom por área geográfica (continentes y, ya existente,
  países) es una aproximación; confirmar visualmente que ningún continente
  deja ver vecinos ni corta países propios de forma confusa.
- Determinar visualmente a partir de qué nivel de zoom mostrar las
  banderas en Explorar mapa sin que se amontonen ilegibles.
