# congreso-scrapper

## Motivación

Con esta aplicación esperamos facilitar la manipulación de los datos publicamente disponibles en el [Congreso de los Diputados](http://congreso.es) de España para su transformación en información util promoviendo, como consecuencia, el surgimiento de nuevos proyectos de seguimiento y análisis político basados en hechos, es decir, en la actividad parlamentaria.

Agradeceremos cualquier aportación para la mejora de la aplicación. Por favor, no dudes en colaborar creando "pull requests", [Issues](https://github.com/tovarlogic/congreso-scrapper/issues) o aportando ideas en [Discussions](https://github.com/tovarlogic/congreso-scrapper/discussions). 

Esto es un proyecto 100% código abierto, sin ánimo de lucro y queremos que sea tanto desarrollado como mantenido colaborativamente por ciudadanos/as normales en su tiempo libre.


## Descripción
Esta aplicación nace de la necesidad de ampliar la funcionalidad de [Seguimiento-Político](https://seguimiento-politico.github.io), el proyecto matriz y que en la actualidad es un simple prototipo.

Aunque la web del congreso cuenta con una zona de ["Datos Abiertos"](https://www.congreso.es/es/datos-abiertos) los datos disponibles por medio de los archivos JSON, XML o CSV no son completos. Lo mismo ocurre si se emplean los "end points" disponibles en la web (ej: busqueda de iniciativas, busqueda de diputados, organos, etc...). Hay datos relevantes que no se devuelven como objetos JSON, sino que se requiere de un "webscrapper" para capturar los datos faltantes que si se muentran en el html resultante. 

Con "congreso-scrapper" pretendemos eliminar estas lagunas. Por eso, la app no se limita a devolver los datos publicados en cada unos de los "end points", sino que los combina (tras obtenerlos de distintas partes de la web del congreso) y los almacena de manera estructurada en una base de datos propia. 

## Lenguajes de programación y herramientas empleadas
Aplicación escrita en JavaScript usando como framework Node.js. Para la gestión de dependencias hemos usado NPM y MongoDB como base de datos.

Dada la ingente cantidad de información, hemos descartado la opción inicialmente implementada de guardar los datos en archivos JSON. Ahora únicamente se registran en la BBDD.

## Estado actual de desarrollo
- [ ] Web scrapping y registro en BBDD:
    - [x] Legislaturas. 
    - [x] Iniciativas. 
    - [x] Tipos de iniciativas. 
    - [x] Composición de las legislaturas
        - [x] diputados/as. 
        - [x] grupos parlamentarios y partidos
        - [x] comisiones
        - [x] subcomisiones
    - [ ] Composición de las comisiones
    - [ ] Tipos de tramitación
    - [ ] Información relevante de cada iniciativa
        - [ ] Iniciativas relacionadas
        - [ ] Votaciones
        - [ ] Intervenciones
        - [x] Documentos/publicaciones
- [ ] ~~Desarrollar y publicar una API REST~~ (opción descartada, será parte de otro repositorio distinto)

## Instalación
Antes de ejecutar 'app.js' asegurate de haber instalado las dependencias correctamente mediante el comando:  "npm install".

## Guía para su uso
Al ejecutar "node app.js", aparecerá un menú contextual con cinco (5) opciones, pulsando el número o letra de cada una de ellas se ejecutará la subrutina correspondiente. 

Las opciones en cuestión son:
1. Initial Basic Scrapping: Tras instalar todo, tendrás que ejecutar esta opción la primera vez (tardará muchas horas en finalizar el scrapping). Se encargará de guardar en tu BBDD la siguiente info:
    - Legislaturas y su composición en términos de "Grupos parlamentarios" y "Formaciones políticas".
    - Registro histórico de diputados, junto con los datos relevantes como partido, circunscripción y fechas de alta y baja en el congreso.
    - Registro de todas las iniciativas desde la "Legislatura constituyente" hasta la actualidad.
    - Topolología de iniciativas (el catálogo de todos los tipos de iniciativas)

2. Initial Detailed Scrapping: Tras el paso anterior esta rutina se encargará (en proceso de desarrollo) de adjuntar a cada iniciativa existente su información relevante como:
    - Votaciones
    - Intervenciones
    - Publicaciones
    - Otras Iniciativas relacionadas
Al igual que en el caso anterior sólo se tendrá que ejecutar esta opción una vez.

3. One Legislature Basic Scrapping: Esta opción está diseñada para rehacer el "paso 1" pero únicamente para una legislatura determinada. Su utilidad es la de mantener actualizada la información de la legislatura actual.

4. One Legislature Detailed Scrapping: Al igual que en el "paso 2" añadirá la información relevante de cada iniciativa de la legislatura dada. (Es posible que esta función acabe desapareciendo para fusionarse con la anterior).

5. Salir: Sin comentarios.

