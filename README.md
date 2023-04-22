# congreso-scrapper
"Web scrapper" de la página oficial del [Congreso de los Diputados](http://congreso.es) de España.

Aunque la web del congreso cuenta con una zona de ["Datos Abiertos"](https://www.congreso.es/es/datos-abiertos) su funcionalidad parece estar enfocada en búsquedas manuales. Además la información que se obtiene por medio de los archivos JSON, XML o CSV no es completa. 

Esta aplicación pretende registrar los datos relativos a la actividad legislativa española (desde la legislatura constituyente hasta la actualidad) de una manera completa y estructurada que facilite su posterior transformación y análisis.

Aplicación escrita en JavaScript para Node.js, usando NPM para la gestión de dependencias y MongoDB como base de datos.

Dada la ingente cantidad de datos, hemos descartado la opción inicialmente implementada de guardar los datos en archivos JSON. Ahora únicamente se registra en una base de datos MongoDB (Si quieres usar otro tipo de BBDD tendrás que modificar el código).

## Instalación
Antes de ejecutar app.js asegurate de haber instalado las dependencias correctamente mediante el comando:  "npm install"


## Funcionalidad actual
- [ ] Web scrapping:
    - [x] Legislaturas. 
    - [x] Iniciativas. 
    - [x] Tipología. 
    - [x] Composición de las legislaturas
        - [x] diputados/as. 
        - [x] grupos parlamentarios y partidos
    - [ ] Información relevante de cada iniciativa
        - [ ] Votaciones
        - [ ] Intervenciones
        - [ ] Documentos/publicaciones
- [ ] Desarrollar y publicar una API REST