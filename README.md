# StudyIA – Asistente inteligente para el estudio

## 1. Descripción general

StudyIA es una aplicación web desarrollada para ayudar a los estudiantes a comprender, resumir y repasar sus apuntes mediante inteligencia artificial.

La aplicación permite introducir texto directamente o cargar documentos PDF y TXT. A partir del contenido proporcionado, StudyIA genera resúmenes estructurados y cuestionarios tipo test para facilitar el aprendizaje y el autoaprendizaje.

El objetivo principal es ofrecer una herramienta sencilla, accesible e intuitiva que permita optimizar el tiempo de estudio.

## 2. Objetivos del proyecto

- Facilitar la comprensión de los contenidos académicos.
- Automatizar la generación de resúmenes mediante inteligencia artificial.
- Crear preguntas tipo test para reforzar el aprendizaje.
- Permitir la descarga de los resultados en formato PDF.
- Ofrecer una aplicación accesible desde el navegador web.

## 3. Stack tecnológico

### Frontend
- Angular
- TypeScript
- HTML5
- CSS3
- jsPDF para la generación de documentos PDF.

### Backend
- Python 3.12
- FastAPI
- Uvicorn
- PyMuPDF para el procesamiento de documentos PDF.
- Groq API para la generación de contenido mediante inteligencia artificial.
- Modelo `openai/gpt-oss-120b`.

## 4. Funcionalidades principales

- Introducción de apuntes mediante texto.
- Carga de documentos PDF y TXT.
- Validación del formato y tamaño de los archivos.
- Generación automática de resúmenes estructurados.
- Generación de 10 preguntas tipo test con cuatro opciones de respuesta.
- Inclusión de explicaciones para las respuestas correctas.
- Selección de respuestas y corrección automática del cuestionario.
- Cálculo de la puntuación obtenida.
- Descarga del resumen en PDF.
- Descarga del test corregido en PDF.

## 5. Estructura del proyecto

```text
StudyIA/
├── studyia-backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .gitignore
├── studyia-frontend/
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   └── .gitignore
├── presentacion/
└── README.md
```

## 6. Instalación y ejecución

La aplicación está dividida en dos partes: frontend y backend.

### Requisitos previos

- Python 3.12.
- Node.js y npm.
- Angular CLI.
- Una clave de API de Groq.

### Configuración del backend

1. Acceder a la carpeta `studyia-backend`.

2. Crear un entorno virtual:

```powershell
python -m venv .venv
```

3. Activar el entorno virtual:

```powershell
.\.venv\Scripts\Activate.ps1
```

4. Instalar las dependencias:

```powershell
pip install -r requirements.txt
```

5. Crear un archivo `.env` en la carpeta `studyia-backend` con la siguiente variable:

```text
GROQ_API_KEY=TU_CLAVE_DE_GROQ
```

6. Iniciar el servidor:

```powershell
python -m uvicorn main:app --reload
```

El backend estará disponible en:

`http://localhost:8000`

La documentación interactiva de la API estará disponible en:

`http://localhost:8000/docs`

### Configuración del frontend

1. Acceder a la carpeta `studyia-frontend`.

2. Instalar las dependencias:

```powershell
npm install
```

3. Iniciar Angular:

```powershell
ng serve --open
```

El frontend estará disponible en:

`http://localhost:4200`

## 7. Despliegue

La aplicación está desplegada y disponible públicamente mediante los siguientes servicios:

- **Aplicación web:** https://study-ia-phi.vercel.app
- **Repositorio GitHub:** https://github.com/SergioGarciaLanza/StudyIA
- **Backend API:** https://studyia-backend-wmse.onrender.com
- **Documentación de la API (Swagger):** https://studyia-backend-wmse.onrender.com/docs

El frontend está alojado en Vercel y el backend en Render.

La generación de resúmenes y cuestionarios se realiza mediante Groq API.

## 8. Presentación del proyecto

La presentación del Trabajo Fin de Máster estará disponible en:

[StudyIA - Presentación del TFM](presentacion/StudyIA_Presentacion_TFM.pptx.pdf)

## 9. Vídeo explicativo

El vídeo incluirá una explicación del proyecto y una demostración de su funcionamiento mediante captura de pantalla.

Enlace al vídeo: [Ver vídeo de presentación y demostración de StudyIA](https://youtu.be/WL1vmrTNAds)

## 10. Seguridad

La clave de acceso a Groq se configura mediante variables de entorno y no debe incluirse en el repositorio público.

El archivo `.env`, los entornos virtuales y las dependencias instaladas localmente están excluidos del control de versiones.

Para ejecutar el backend en local es necesario disponer de una clave API propia de Groq y configurarla en el archivo `.env`.

## 11. Autoría

Proyecto desarrollado por Sergio García Lanza como Trabajo Fin de Máster en el ámbito del desarrollo de aplicaciones con inteligencia artificial.
