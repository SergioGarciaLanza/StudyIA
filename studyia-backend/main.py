
import os
import fitz

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai

load_dotenv()

app = FastAPI(
    title="StudyIA API",
    description="API inteligente para estudiantes",
    version="1.0.0"
)


allowed_origins = ["http://localhost:4200"]

frontend_url = os.getenv("FRONTEND_URL")

if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class TextRequest(BaseModel):
    text: str = Field(min_length=1, max_length=30000)


class Question(BaseModel):
    question: str
    options: list[str]
    correct_answer: int
    explanation: str


class QuizResponse(BaseModel):
    questions: list[Question]


@app.get("/")
def home():
    return {"message": "Bienvenido a StudyIA API"}


@app.get("/health")
def health():
    return {"status": "OK", "application": "StudyIA"}


@app.post("/summarize")
def summarize(request: TextRequest):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="No se ha configurado la clave de Gemini."
        )

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=(
                "Eres un asistente educativo. "
                "Resume los siguientes apuntes en español. "
                "Organiza el contenido con títulos y apartados. "
                "Destaca los conceptos más importantes y "
                "utiliza un lenguaje claro y fácil de estudiar.\n\n"
                + request.text
            )
        )

        if not response.text:
            raise HTTPException(
                status_code=502,
                detail="La IA no ha devuelto ningún resumen."
            )

        return {"summary": response.text}

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR DE GEMINI:", repr(e))
    raise HTTPException(
        status_code=502,
        detail="No se ha podido generar el resumen con Gemini."
    )


@app.post("/generate-quiz", response_model=QuizResponse)
def generate_quiz(request: TextRequest):

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="No se ha configurado la clave de Gemini."
        )

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=f"""
            Eres un profesor experto en crear exámenes tipo test.

            Analiza los siguientes apuntes y genera exactamente
            10 preguntas tipo test en español.

            Cada pregunta debe tener:
            - Un enunciado claro.
            - Exactamente 4 opciones de respuesta.
            - Una única respuesta correcta.
            - Una explicación de la respuesta correcta.

            Devuelve exclusivamente un JSON válido con esta estructura:

            {{
                "questions": [
                    {{
                        "question": "Enunciado de la pregunta",
                        "options": [
                            "Opción A",
                            "Opción B",
                            "Opción C",
                            "Opción D"
                        ],
                        "correct_answer": 0,
                        "explanation": "Explicación de la respuesta"
                    }}
                ]
            }}

            El campo correct_answer debe ser un índice:
            0 para A, 1 para B, 2 para C y 3 para D.

            APUNTES:
            {request.text}
            """,
            config={
                "response_mime_type": "application/json",
                "response_schema": QuizResponse
            }
        )

        if not response.text:
            raise HTTPException(
                status_code=502,
                detail="La IA no ha generado las preguntas."
            )

        quiz = QuizResponse.model_validate_json(response.text)

        if len(quiz.questions) != 10:
            raise HTTPException(status_code=502, 
                                detail="La IA no ha generado exactamente 10 preguntas."
            )

        if any(
            len(q.options) != 4 or q.correct_answer not in range(4)
            for q in quiz.questions
        ):
            raise HTTPException(
                status_code=502,
                detail="La IA ha generado preguntas con un formato incorrecto."
            )

        return quiz

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR AL GENERAR TEST:", repr(e))
        raise HTTPException(
            status_code=502,
            detail="No se ha podido generar el test."
        )


@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    filename = file.filename or ""

    content = await file.read()

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="El archivo supera el tamaño máximo permitido de 5 MB."
        )

    extension = filename.lower().split(".")[-1]

    if extension not in ["pdf", "txt"]:
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos PDF y TXT."
        )

    try:

        if not content:
            raise HTTPException(
                status_code=400,
                detail="El archivo está vacío."
            )

        if extension == "pdf":
            document = fitz.open(stream=content, filetype="pdf")

            text = "\n".join(
                page.get_text() for page in document
            )

            document.close()

        else:
            try:
                text = content.decode("utf-8-sig")
            except UnicodeDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="El archivo TXT debe estar codificado en UTF-8."
                )

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="No se ha encontrado texto en el documento."
            )

        if len(text) > 30000:
            raise HTTPException(
                status_code=400,
                detail="El documento supera el límite de 30000 caracteres."
            )

        return {
            "filename": filename,
            "text": text
        }

    except HTTPException:
        raise

    except Exception as e:
        print("ERROR AL PROCESAR DOCUMENTO:", repr(e))
        raise HTTPException(
            status_code=500,
            detail="No se ha podido procesar el documento."
        )


