# congreso-scrapper
"Web scrapper" de la página oficial del Congreso de los Diputados de España (http://congreso.es). "

Se trata de una aplicación escrita en JavaScript y Node.js

El objetivo de esta aplicación es facilitar a la comunidad poder desarrollar aplicaciones que faciliten el acceso a la información pública relativa a la actividad parlamentaria en España, aportando un acceso eficaz a los datos publicados en http://congreso.es.

## Instalacion
Antes de ejecutar app.js asegurate de haber instalado las dependencias correctamente: "npm install"

## Scrapping
Por el momento la información que se registra es:
- Legislaturas 
- Iniciativas (tarda bastantes horas en registrarlas todas)

La aplicación guarda la información capturada de dos maneras:
- Como archivos JSON dentro de la carpeta "data".
- En una base de datos. Por defecto se usa la base de datos llamada "seguimiento-politico" en MongoDB. Si quieres usar otro tipo de BBDD tendrás que modificar el código.

### Tareas pendientes (TO-DO)
Ampliar la funcionalidad de scrapping para registrar:
- La topología de las iniciativas (tanto en JSON como en la BBDD). Por ejemplo:
    {
        "codigo": "184",
        "supertipo": "Función de control",
        "tipo": "Preguntas con respuesta escrita",
        "subtipo": "Pregunta al Gobierno con respuesta escrita"
    }
- Registrar la composición de las legislaturas (diputados/as, grupos parlamentarios)
- Registrar la información relevante de cada iniciativa (votaciones, intervenciones, publicaciones, etc...)