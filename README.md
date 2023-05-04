# congreso-scrapper

## Motivación
"Web scrapper" de la página oficial del [Congreso de los Diputados](http://congreso.es) de España. Esta aplicación nace de la necesidad de ampliar la funcionalidad de [Seguimiento-Político](https://seguimiento-politico.github.io), el proyecto matriz y que en la actualidad es un simple prototipo.

Aunque la web del congreso cuenta con una zona de ["Datos Abiertos"](https://www.congreso.es/es/datos-abiertos) su funcionalidad parece estar enfocada hacia búsquedas manuales. Además, la información que se obtiene por medio de los archivos JSON, XML o CSV no es completa. Hay información relevante no disponible, o al menos no de manera obvia. Pretendemos con esta solución eliminar estas lagunas y construir una base de datos sólida sobre la que construir una aplicación de seguimiento y análisis simple pero eficaz al alcance de cualquiera. 

Por ello, "congreso-scrapper" no se limita a devolver la información publicada en la web del Congreso, sino que la registra en una base de datos propia de una manera estructurada que facilitará su posterior transformación y análisis.

## Lenguajes de programación y herramientas empleadas
Aplicación escrita en JavaScript usando como framwork Node.js. Para la gestión de dependencias hemos usado NPM y MongoDB como base de datos.

Dada la ingente cantidad de datos, hemos descartado la opción inicialmente implementada de guardar los datos en archivos JSON. Ahora únicamente se registra en la BBDD.

## Estado actual de desarrollo
- [ ] Web scrapping y registro en BBDD:
    - [x] Legislaturas. 
    - [x] Iniciativas. 
    - [x] Tipología. 
    - [x] Composición de las legislaturas
        - [x] diputados/as. 
        - [x] grupos parlamentarios y partidos
        - [x] comisiones
        - [ ] subcomisiones
    - [ ] Información relevante de cada iniciativa
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

3. One Legislature Basic Scrapping: Esta opción está diseñada para rehacer el "paso 1" pero únicamente para una legislatura determinada. Se prevé que su utilidad sea la de mantener actualizada la información de la legislatura actual.

4. One Legislature Detailed Scrapping: Al igual que en el "paso 2" añadirá la información relevante de cada iniciativa de la legislatura dada. (Es posible que esta función acabe desapareciendo para fusionarse con la anterior).

5. Salir: Sin comentarios.

