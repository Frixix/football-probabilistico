from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from main import obtener_predicciones_api  # Aquí importamos tu salvavidas de main.py

app = FastAPI()

# Permisos para que el Frontend (React) pueda hablar con este Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/partidos")
def partidos():
    # Ejecuta tu código de main.py y devuelve el resultado
    return obtener_predicciones_api()